// Admin Orders - DB-backed with Stripe fallback
const { requireAuth } = require('./utils/auth');
const { neon } = require('@netlify/neon');
const { drizzle } = require('drizzle-orm/neon-http');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // Verify authentication
    const authError = requireAuth(event);
    if (authError) return authError;

    const qs = event.queryStringParameters || {};
    const limit = Math.min(parseInt(qs.limit) || 50, 200);
    const page = Math.max(parseInt(qs.page) || 1, 1);
    const offset = (page - 1) * limit;

    // Build filters
    const q = (qs.q || '').trim(); // search term (order id or email)
    const startDate = qs.startDate ? new Date(qs.startDate) : null;
    const endDate = qs.endDate ? new Date(qs.endDate) : null;

    try {
        // Try DB first
        try {
            const client = neon();
            const db = drizzle({ client });
            const { runQuery, normalizeRows } = require('./utils/db-utils');

            // Build basic SQL
            let whereClauses = [];
            const params = [];
            let idx = 1;

            if (q) {
                whereClauses.push(`(id ILIKE $${idx} OR customer_email ILIKE $${idx})`);
                params.push(`%${q}%`);
                idx++;
            }

            if (startDate) {
                whereClauses.push(`created_at >= $${idx}`);
                params.push(startDate.toISOString());
                idx++;
            }
            if (endDate) {
                const ed = new Date(endDate);
                ed.setHours(23,59,59,999);
                whereClauses.push(`created_at <= $${idx}`);
                params.push(ed.toISOString());
                idx++;
            }

            const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

            const countSql = `SELECT COUNT(*)::int as count FROM orders ${whereSql}`;
            const selectSql = `SELECT id, stripe_id, product_type, amount_cents, currency, status, customer_email, personalization, metadata, created_at FROM orders ${whereSql} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx+1}`;
            params.push(limit);
            params.push(offset);

            // DB admin-orders query (executing)

            // Run count (use params up to idx-1)
            const countParams = params.slice(0, idx-1);
            const countRes = await runQuery(client, db, countSql, countParams);

            let total = 0;
            try {
                if (countRes && countRes.rows && countRes.rows[0] && typeof countRes.rows[0].count !== 'undefined') total = parseInt(countRes.rows[0].count, 10);
                else if (Array.isArray(countRes) && countRes[0] && typeof countRes[0].count !== 'undefined') total = parseInt(countRes[0].count, 10);
                else if (countRes && typeof countRes.count !== 'undefined') total = parseInt(countRes.count, 10);
            } catch (e) { total = 0; }

            const rowsRes = await runQuery(client, db, selectSql, params);
            const dataRows = normalizeRows(rowsRes);

            const orders = (dataRows || []).map(raw => {
                // Normalize a single row that may be wrapped in arrays or numeric-key objects
                let r = raw;
                try {
                    if (Array.isArray(r) && r.length) r = r[0];
                    // Handle objects like { '0': { ... } }
                    if (r && typeof r === 'object' && !Array.isArray(r) && Object.keys(r).length === 1 && ('0' in r || 0 in r)) {
                        r = r['0'] || r[0];
                    }
                    // Some drivers return nested { rows: [...] } inside the element
                    if (r && typeof r === 'object' && 'rows' in r && Array.isArray(r.rows)) {
                        r = r.rows[0] || r;
                    }
                } catch (e) { /* fall through to use raw */ }

                const meta = r && r.metadata ? (typeof r.metadata === 'string' ? safeJsonParse(r.metadata) : r.metadata) : {};
                return {
                    id: r ? r.id : undefined,
                    customer: {
                        name: meta.customer_name || null,
                        email: r ? r.customer_email : null,
                        note: r ? (r.personalization || (meta && meta.custom_note) || null) : null
                    },
                    products: [{ id: r ? r.product_type : 'unknown', name: r ? r.product_type : 'unknown', quantity: 1, amount: r ? ((r.amount_cents || 0) / 100) : 0 }],
                    amount: r ? ((r.amount_cents || 0) / 100) : 0,
                    status: r ? (r.status || 'unknown') : 'unknown',
                    date: (r && r.created_at ? new Date(r.created_at).toISOString() : null),
                    shippingAddress: meta.shipping || null,
                    paymentStatus: r ? r.status : null,
                    currency: (r && r.currency ? r.currency : 'USD').toUpperCase(),
                    metadata: meta || {}
                };
            });

            // Compute global revenue (sum over amount_cents) if available
            let globalRevenue = null;
            try {
                const revSql = `SELECT COALESCE(SUM(amount_cents)::bigint,0) as cents FROM orders ${whereSql}`;
                const revRes = await runQuery(client, db, revSql, countParams);
                if (revRes && revRes.rows && revRes.rows[0]) globalRevenue = Number(revRes.rows[0].cents || 0) / 100;
                else if (Array.isArray(revRes) && revRes[0] && typeof revRes[0].cents !== 'undefined') globalRevenue = Number(revRes[0].cents || 0) / 100;
            } catch (e) {
                globalRevenue = null;
            }

            // Filter out obvious test/simulated orders (do not surface mocks in admin)
            const isTestOrder = (o) => {
                try {
                    if (!o || !o.id) return false;
                    const id = String(o.id || '');
                    if (id.startsWith('cs_test_') || id.includes('simulated') || id.includes('_sim_')) return true;
                    const email = (o.customer && o.customer.email) ? String(o.customer.email).toLowerCase() : '';
                    if (email.includes('sim-test@') || (email.includes('example.com') && email.startsWith('sim-'))) return true;
                    const meta = o.metadata || {};
                    if (meta && (meta.simulated === true || meta.simulated === 'true' || meta._test === true)) return true;
                } catch (e) { /* ignore */ }
                return false;
            };

            const filteredOrders = orders.filter(o => !isTestOrder(o));

            if (filteredOrders.length !== orders.length) {
                console.info(`admin-orders: filtered out ${orders.length - filteredOrders.length} test/mock orders from DB results`);
            }

            return { statusCode: 200, headers, body: JSON.stringify({ source: 'db', total: filteredOrders.length, page, perPage: limit, globalRevenue, orders: filteredOrders }) };
        } catch (dbErr) {
            console.debug && console.debug('DB query failed, falling back to Stripe:', dbErr?.message || dbErr);
            // fall through to stripe fallback
        }
        const limitStripe = Math.min(limit, 50);
        const sessions = await stripe.checkout.sessions.list({ limit: limitStripe, expand: ['data.line_items'] });

        const orders = [];
        for (const session of sessions.data) {
            if (session.payment_status === 'paid') {
                const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { expand: ['data.price.product'] });
                const products = lineItems.data.map(item => ({ id: mapProductToId(item.price.product), name: item.description || item.price.product.name, quantity: item.quantity, amount: item.amount_total/100 }));
                orders.push({ id: session.id, customer: { name: session.customer_details?.name || null, email: session.customer_details?.email || session.customer_email, note: session.metadata?.custom_note || null }, products, amount: session.amount_total/100, status: determineOrderStatus(session), date: new Date(session.created*1000).toISOString(), shippingAddress: session.shipping_details?.address, paymentStatus: session.payment_status, currency: session.currency?.toUpperCase() || 'USD', metadata: session.metadata || {} });
            }
        }

    // Filter out obvious test/simulated sessions from Stripe fallback as well
    const isTestOrderStripe = (o) => {
        try {
            if (!o || !o.id) return false;
            const id = String(o.id || '');
            if (id.startsWith('cs_test_') || id.includes('simulated') || id.includes('_sim_')) return true;
            const email = (o.customer && o.customer.email) ? String(o.customer.email).toLowerCase() : '';
            if (email.includes('sim-test@') || (email.includes('example.com') && email.startsWith('sim-'))) return true;
            const meta = o.metadata || {};
            if (meta && (meta.simulated === true || meta.simulated === 'true' || meta._test === true)) return true;
        } catch (e) { }
        return false;
    };

    const filteredStripeOrders = orders.filter(o => !isTestOrderStripe(o));
    if (filteredStripeOrders.length !== orders.length) {
        console.info(`admin-orders: filtered out ${orders.length - filteredStripeOrders.length} test/mock orders from Stripe fallback`);
    }

    const stripeRevenue = filteredStripeOrders.reduce((s, o) => s + (o.amount || 0), 0);
    return { statusCode: 200, headers, body: JSON.stringify({ source: 'stripe', total: filteredStripeOrders.length, page: 1, perPage: limitStripe, stripeRevenue, orders: filteredStripeOrders }) };

    } catch (error) {
        console.error('admin-orders: unexpected error', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to fetch orders', details: error.message }) };
    }
};

function mapProductToId(product) {
    // Map Stripe product IDs to internal product IDs
    const productMap = {
        [process.env.STRIPE_AUDIOBOOK_PRODUCT_ID]: 'audiobook',
        [process.env.STRIPE_SIGNED_BOOK_PRODUCT_ID]: 'signed-book',
        [process.env.STRIPE_BUNDLE_PRODUCT_ID]: 'bundle'
    };
    
    return productMap[product.id] || 'unknown';
}

function determineOrderStatus(session) {
    // Check if order has physical products that need shipping
    const hasPhysical = session.shipping_details?.address;
    
    if (!hasPhysical) {
        return 'digital_delivered';
    }
    
    // For physical orders, check age to simulate shipping status
    const orderDate = new Date(session.created * 1000);
    const daysSinceOrder = (new Date() - orderDate) / (1000 * 60 * 60 * 24);
    
    if (daysSinceOrder > 10) {
        return 'shipped';
    } else if (daysSinceOrder > 2) {
        return 'processing';
    } else {
        return 'pending_fulfillment';
    }
}
