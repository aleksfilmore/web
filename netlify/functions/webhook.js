// Netlify function to handle Stripe webhooks
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
let resend = null;
try {
    const { Resend } = require('resend');
    if (process.env.RESEND_API_KEY) {
        resend = new Resend(process.env.RESEND_API_KEY);
    } else {
        console.log('RESEND_API_KEY not configured; outbound emails will be disabled');
    }
} catch (e) {
    // If the resend library is not available locally (dev), keep resend null and continue
    console.log('Resend library not available or failed to initialize:', e?.message || e);
    resend = null;
}

exports.handler = async (event, context) => {
    console.debug && console.debug('Stripe webhook received');
    
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        console.log('Method not allowed:', event.httpMethod);
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    let body = event.body;
    
    console.debug && console.debug('Webhook raw event info', { isBase64Encoded: event.isBase64Encoded, hasSignature: !!sig });
    
    // Handle different body encodings in Netlify
    if (event.isBase64Encoded && body) {
        body = Buffer.from(body, 'base64').toString('utf8');
    }
    
    // Additional body handling for different scenarios
    if (typeof body !== 'string') {
        if (body && typeof body === 'object') {
            body = JSON.stringify(body);
        } else {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
        }
    }
    
    console.log('Final body info:', {
        type: typeof body,
        length: body.length,
        firstChars: body.substring(0, 100),
        lastChars: body.substring(body.length - 50)
    });
    
    let stripeEvent;
    
        try {
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.replace(/\s/g, '');
        if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');

        try {
            stripeEvent = stripe.webhooks.constructEvent(body, sig, webhookSecret);
        } catch (primaryErr) {
            if (event.body !== body) {
                try { stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret); } catch (secondaryErr) { throw primaryErr; }
            } else {
                throw primaryErr;
            }
        }
    } catch (err) {
        console.error('Webhook verification failed:', err.message);
        return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: `Webhook Error: ${err.message}`, timestamp: new Date().toISOString() }) };
    }
    
    // Process the webhook event
    try {
    console.log('Processing webhook event...');
        
        switch (stripeEvent.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(stripeEvent.data.object);
                break;
            default:
                console.log(`ℹ️ Unhandled event type: ${stripeEvent.type}`);
        }
        
    console.log('Webhook processed successfully');
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                received: true,
                event_type: stripeEvent.type,
                event_id: stripeEvent.id,
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error('Error processing webhook:', error);
        
        // Still return 200 to prevent Stripe retries, but log the error
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                received: true,
                error: 'Processing failed - logged for manual review',
                event_type: stripeEvent.type,
                event_id: stripeEvent.id,
                timestamp: new Date().toISOString()
            })
        };
    }
};

async function handleCheckoutSessionCompleted(session) {
    console.log('💳 Processing completed checkout session:', session.id);
    
    const customerEmail = session.customer_details?.email || session.customer_email;
    console.log('👤 Customer email:', customerEmail);
    console.log('Amount:', session.amount_total / 100, session.currency);
    console.log('Payment status:', session.payment_status);
    
    if (!customerEmail) {
        throw new Error('No customer email found in session');
    }
    
    if (session.payment_status !== 'paid') {
    console.log('Payment not completed, skipping email');
        return;
    }
    
    // Check if this includes audiobook access
    const hasAudiobook = await checkForAudiobookAccess(session);
    console.log('🎧 Has audiobook access:', hasAudiobook);
    
    if (!hasAudiobook) {
        console.log('📦 No audiobook in order, skipping audiobook email');
        return;
    }
    
    // Generate access token
    const accessToken = generateAccessToken(customerEmail, session.id);
    console.log('🔑 Generated access token');
    
    // Send audiobook access email
        await sendAudiobookAccessEmail(String(customerEmail), accessToken, session);
    
    console.log('Checkout session processing completed');

    // Persist metadata and basic order row (best-effort)
    try {
        const { neon } = require('@netlify/neon');
        const { drizzle } = require('drizzle-orm/neon-http');
        const { runQuery } = require('./utils/db-utils');

        const client = neon();
        const db = drizzle({ client });

        const metadata = session.metadata || {};
        const productType = metadata.product || 'unknown';
        const customNote = metadata.custom_note || '';
        const amountCents = session.amount_total || 0;

        // Idempotent upsert: if row exists, update metadata/status only when changed
        const selectSql = `SELECT status, metadata FROM orders WHERE id = $1`;
        const insertSql = `INSERT INTO orders (id, stripe_id, product_type, amount_cents, currency, status, customer_email, personalization, metadata, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())`;
        const updateSql = `UPDATE orders SET status = $1, metadata = $2 WHERE id = $3`;

        const paramsInsert = [
            session.id,
            session.id,
            productType,
            amountCents,
            session.currency || 'USD',
            session.payment_status || 'paid',
            customerEmail,
            customNote,
            JSON.stringify(Object.assign({}, metadata))
        ];

        const paramsSelect = [session.id];

        try {
            console.log('DB: attempting idempotent persist for order', session.id);

            // Check if order exists
            let existing = null;
            try {
                const selRes = await runQuery(client, db, selectSql, paramsSelect);
                if (selRes && Array.isArray(selRes.rows)) existing = selRes.rows[0] || null;
                else if (Array.isArray(selRes)) existing = selRes[0] || null;
                else if (selRes && selRes.length) existing = selRes[0];
            } catch (e) {
                console.warn('DB select failed (will try upsert insert regardless):', e.message || e);
            }

            if (existing) {
                // Compare status and metadata; update if necessary
                const existingStatus = existing.status || null;
                let existingMetadata = existing.metadata || null;
                try { existingMetadata = typeof existingMetadata === 'string' ? JSON.parse(existingMetadata) : existingMetadata; } catch(e) {}

                const incomingMetaStr = JSON.stringify(metadata || {});
                const existingMetaStr = JSON.stringify(existingMetadata || {});

                if (existingStatus === (session.payment_status || 'paid') && incomingMetaStr === existingMetaStr) {
                    console.log('DB: existing order matches incoming status & metadata — skipping update');
                } else {
                    console.log('DB: existing order differs; performing update');
                    const paramsUpdate = [session.payment_status || 'paid', JSON.stringify(Object.assign({}, metadata)), session.id];
                    await runQuery(client, db, updateSql, paramsUpdate);
                }
            } else {
                // Insert new row
                try {
                    await runQuery(client, db, insertSql, paramsInsert);
                } catch (insErr) {
                    // Try upsert via UPDATE after insert failure (race conditions)
                    console.warn('Insert failed, attempting update as fallback:', insErr.message || insErr);
                    try {
                        const paramsUpdate2 = [session.payment_status || 'paid', JSON.stringify(Object.assign({}, metadata)), session.id];
                        await runQuery(client, db, updateSql, paramsUpdate2);
                        console.log('Fallback update succeeded');
                    } catch (upErr) {
                        console.warn('Fallback update also failed:', upErr.message || upErr);
                        throw upErr;
                    }
                }
            }

        } catch (finalErr) {
            console.warn('⚠️ Failed to persist order to DB after attempts (continuing):', finalErr?.message || finalErr);
        }

    } catch (err) {
        console.warn('⚠️ DB persistence block encountered an error; skipping DB persist:', err?.message || err);
    }

    // Append audit log for ingestion (always local append for traceability)
    try {
        const fs = require('fs');
        const path = require('path');
        const logsDir = path.join(__dirname, '..', '..', 'logs');
        if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
        const auditFile = path.join(logsDir, 'order-ingest-audit.log');
        const entry = {
            ts: new Date().toISOString(),
            sessionId: session.id,
            email: customerEmail,
            product: session.metadata?.product || null,
            customNote: session.metadata?.custom_note || null,
            amount: session.amount_total || 0,
            currency: session.currency || 'USD'
        };
        fs.appendFileSync(auditFile, JSON.stringify(entry) + '\n', { encoding: 'utf8' });
        console.log('📝 Audit entry appended to', auditFile);
    } catch (e) {
        console.warn('Failed to append order ingest audit log:', e?.message || e);
    }

}
function generateAccessToken(email, sessionId) {
    return Buffer.from(`${email}:${sessionId}:${Date.now()}`).toString('base64');
}

async function checkForAudiobookAccess(session) {
    try {
        // Get line items to check what was purchased
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            expand: ['data.price.product']
        });
        
        console.log('🛒 Line items:', lineItems.data.length);
        
        const hasAudiobook = lineItems.data.some(item => {
            const priceId = item.price?.id;
            const productName = item.price?.product?.name?.toLowerCase() || '';
            
            console.log(`📦 Item: ${productName} (${priceId})`);
            
            return (
                priceId === process.env.STRIPE_AUDIOBOOK_PRICE_ID ||
                priceId === process.env.STRIPE_BUNDLE_PRICE_ID ||
                productName.includes('audiobook') ||
                productName.includes('bundle')
            );
        });
        
        return hasAudiobook;
        
    } catch (error) {
        console.error('Error checking line items:', error);
        // Default to true to ensure customers get access
        return true;
    }
}

async function sendAudiobookAccessEmail(customerEmail, accessToken, session) {
    const accessUrl = `${process.env.SITE_URL}/audiobook-player?token=${accessToken}`;
    
    const emailContent = `
        <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', sans-serif; background-color: #0E0F10; color: #F7F3ED; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="color: #FF3B3B; font-size: 28px; margin: 0;">🚩 Your Audiobook is Ready!</h1>
            </div>
            
            <div style="background: linear-gradient(135deg, rgba(247,243,237,0.05) 0%, rgba(247,243,237,0.1) 100%); border: 1px solid rgba(247,243,237,0.1); border-radius: 16px; padding: 30px; margin-bottom: 30px;">
                <h2 style="color: #F7F3ED; margin: 0 0 15px 0;">Your audiobook is ready to stream!</h2>
                <p style="color: rgba(247,243,237,0.8); margin: 0 0 25px 0;">
                    Thanks for supporting independent queer authors and their beautifully chaotic storytelling! Here's your personal streaming link:
                </p>
                
                <div style="text-align: center;">
                    <a href="${accessUrl}" style="
                        background-color: #FF3B3B;
                        color: #F7F3ED;
                        padding: 15px 30px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 600;
                        display: inline-block;
                        margin: 10px 0;
                    ">🎧 Start Listening</a>
                </div>
                
                <p style="color: rgba(247,243,237,0.6); font-size: 14px; text-align: center;">
                    Bookmark this link for future access to your audiobook.
                </p>
            </div>
            
            <div style="border-top: 1px solid rgba(247,243,237,0.1); padding-top: 20px; font-size: 14px; color: rgba(247,243,237,0.6);">
                <p>• This link is unique to you and never expires</p>
                <p>• Stream on any device with an internet connection</p>
                <p>• Need help? Reply to this email</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: rgba(247,243,237,0.6); font-size: 12px;">
                <p>Happy listening! 🎵</p>
                <p style="margin: 0;">- Aleks</p>
            </div>
        </div>
    `;
    
    try {
        console.log('📬 Sending audiobook access email...');
        const FROM_EMAIL = process.env.FROM_EMAIL || 'Aleks Filmore <aleksfilmore@gmail.com>';

        await resend.emails.send({
            from: FROM_EMAIL,
            to: String(customerEmail),
            subject: '🎧 Your Audiobook is Ready!',
            html: emailContent
        });
        
    console.log('Audiobook access email sent to', customerEmail);
        
    } catch (error) {
        console.error('Failed to send email:', error);
        throw new Error(`Email delivery failed: ${error.message}`);
    }
}

// Export helper for local testing
exports.handleCheckoutSessionCompleted = handleCheckoutSessionCompleted;