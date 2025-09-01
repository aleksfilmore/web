const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

// Simple admin auth: provide header 'x-admin-token' equal to ADMIN_API_TOKEN env var
function ensureAdmin(event) {
    const token = (event.headers['x-admin-token'] || event.headers['X-Admin-Token'] || '').trim();
    if (!process.env.ADMIN_API_TOKEN) return { ok: false, error: 'ADMIN_API_TOKEN not configured' };
    if (!token) return { ok: false, error: 'Missing x-admin-token header' };
    if (token !== process.env.ADMIN_API_TOKEN) return { ok: false, error: 'Invalid admin token' };
    return { ok: true };
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, x-admin-token',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };

    try {
        const auth = ensureAdmin(event);
        if (!auth.ok) return { statusCode: 403, headers, body: JSON.stringify({ error: auth.error }) };

        if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

        const body = JSON.parse(event.body || '{}');
        const sessionId = body.sessionId || body.session || body.id;
        if (!sessionId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'sessionId is required' }) };

        // Retrieve session
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (!session) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Session not found' }) };

        const customerEmail = session.customer_details?.email || session.customer_email;
        if (!customerEmail) return { statusCode: 400, headers, body: JSON.stringify({ error: 'No customer email on session' }) };

        // List line items
        const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { expand: ['data.price.product'] });
        const hasAudiobook = (lineItems.data || []).some(item => {
            const priceId = item.price?.id;
            const productName = item.price?.product?.name?.toLowerCase() || '';
            return (
                priceId === process.env.STRIPE_AUDIOBOOK_PRICE_ID ||
                priceId === process.env.STRIPE_BUNDLE_PRICE_ID ||
                productName.includes('audiobook') ||
                productName.includes('bundle')
            );
        });

        if (!hasAudiobook) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Session does not include audiobook' }) };

        // Generate token and send email via Resend
        const token = Buffer.from(`${customerEmail}:${sessionId}:${Date.now()}`).toString('base64');
        const accessUrl = `${process.env.SITE_URL || 'https://aleksfilmore.com'}/audiobook-player.html?token=${encodeURIComponent(token)}&email=${encodeURIComponent(customerEmail)}`;

        // Lazy init resend
        let resend = null;
        try { resend = new Resend(process.env.RESEND_API_KEY || ''); } catch (e) { /* continue */ }
        if (!resend) return { statusCode: 500, headers, body: JSON.stringify({ error: 'Resend client not configured' }) };

        const html = `
            <div style="max-width:600px;margin:0 auto;font-family:Inter,system-ui;color:#F7F3ED;background:#0E0F10;padding:30px;border-radius:12px;">
              <h2 style="color:#FF3B3B;">🎧 Your Audiobook is Ready!</h2>
              <p>Thanks for your purchase — click below to start listening.</p>
              <p style="text-align:center;margin:24px 0;"><a href="${accessUrl}" style="background:#FF3B3B;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;">🎧 Start Listening</a></p>
              <p style="color:#C7CDD4;font-size:13px;">If you need help, reply to this email.</p>
            </div>
        `;

        const FROM_EMAIL = process.env.FROM_EMAIL || 'Aleks Filmore <aleks@aleksfilmore.com>';
        let sendRes = null;
        let preSendPayload = null;
        // Persist the send payload and effective FROM_EMAIL for debugging on the host
        try {
            const dataDir = path.join(__dirname, '..', '..', 'data');
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
            const diagFile = path.join(dataDir, 'tmp_admin_resend_response.json');
            const payload = {
                timestamp: new Date().toISOString(),
                from: FROM_EMAIL,
                to: String(customerEmail),
                subject: '🎧 Your Audiobook is Ready!',
                htmlPreview: html && String(html).substring(0, 200)
            };
            preSendPayload = payload;
            try { fs.writeFileSync(diagFile, JSON.stringify({ preSend: payload }, null, 2)); } catch (e) { /* ignore */ }

            sendRes = await resend.emails.send({
                from: FROM_EMAIL,
                to: String(customerEmail),
                subject: '🎧 Your Audiobook is Ready!',
                html
            });
        } catch (sendErr) {
            // Persist diagnostic for troubleshooting
            try {
                const dataDir = path.join(__dirname, '..', '..', 'data');
                if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
                const diagFile = path.join(dataDir, 'tmp_admin_resend_response.json');
                fs.writeFileSync(diagFile, JSON.stringify({ error: sendErr?.response?.data || sendErr?.message || String(sendErr) }, null, 2));
            } catch (e) { /* ignore */ }
            throw sendErr;
        }

        // Persist to data/purchases.json for admin tracing
        try {
            const dataDir = path.join(__dirname, '..', '..', 'data');
            if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
            const purchasesFile = path.join(dataDir, 'purchases.json');
            let purchases = [];
            if (fs.existsSync(purchasesFile)) purchases = JSON.parse(fs.readFileSync(purchasesFile, 'utf8')) || [];

            const existing = purchases.find(p => p.sessionId === sessionId);
            if (!existing) {
                purchases.push({
                    sessionId,
                    customerEmail,
                    accessToken: token,
                    purchaseDate: new Date().toISOString(),
                    amountTotal: (session.amount_total || 0) / 100,
                    products: (lineItems.data || []).map(i => ({ id: i.price?.product?.id || i.price?.id || 'unknown', quantity: i.quantity || 1 }))
                });
                fs.writeFileSync(purchasesFile, JSON.stringify(purchases, null, 2));
            }
        } catch (e) {
            console.warn('Failed to persist purchase record:', e?.message || e);
        }

    // Return the send result and pre-send payload for admin debugging
    const safeResult = { data: sendRes?.data || null, error: sendRes?.error || null };
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Audiobook access resent', preSend: preSendPayload, emailResult: safeResult }) };

    } catch (error) {
        console.error('admin-resend-by-session error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: error.message || String(error) }) };
    }
};
