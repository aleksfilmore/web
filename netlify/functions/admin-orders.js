// Admin Orders - Real Stripe Data
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { requireAuth } = require('./utils/auth');

exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Verify authentication
    const authError = requireAuth(event);
    if (authError) return authError;

    try {
        console.log('Fetching orders from Stripe...');
        
        const qs = event.queryStringParameters || {};
        const limit = parseInt(qs.limit) || 50;

        // Support date ranges: startDate & endDate (ISO) or preset range (today,yesterday,last7,last30,last90)
        let createdFilter = {};
        if (qs.startDate && qs.endDate) {
            const startTs = Math.floor(new Date(qs.startDate).getTime() / 1000);
            const endTs = Math.floor(new Date(qs.endDate).getTime() / 1000);
            createdFilter = { created: { gte: startTs, lte: endTs } };
        } else if (qs.range) {
            const now = new Date();
            let days = 30;
            if (qs.range === 'today') days = 1;
            if (qs.range === 'yesterday') days = 2;
            if (qs.range === 'last7') days = 7;
            if (qs.range === 'last30') days = 30;
            if (qs.range === 'last90') days = 90;
            createdFilter = { created: { gte: Math.floor(Date.now() / 1000) - (days * 86400) } };
        }

        // Fetch recent checkout sessions
        const sessions = await stripe.checkout.sessions.list({
            limit: limit,
            expand: ['data.line_items'],
            ...(Object.keys(createdFilter).length ? { created: createdFilter.created } : {})
        });
        
        const orders = [];
        
        for (const session of sessions.data) {
            if (session.payment_status === 'paid') {
                // Get line items for this session
                const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
                    expand: ['data.price.product']
                });
                
                const products = lineItems.data.map(item => ({
                    id: mapProductToId(item.price.product),
                    name: item.description || item.price.product.name,
                    quantity: item.quantity,
                    amount: item.amount_total / 100
                }));
                
                orders.push({
                    id: session.id,
                    customer: {
                        name: session.customer_details?.name || 'Unknown',
                        email: session.customer_details?.email || session.customer_email
                    },
                    products: products,
                    amount: session.amount_total / 100,
                    status: determineOrderStatus(session),
                    date: new Date(session.created * 1000).toISOString(),
                    shippingAddress: session.shipping_details?.address,
                    paymentStatus: session.payment_status,
                    currency: session.currency?.toUpperCase() || 'USD'
                });
            }
        }
        
        // Sort by date (newest first)
        orders.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        console.log(`Found ${orders.length} orders`);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(orders)
        };

    } catch (error) {
        console.error('Orders fetch error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to fetch orders',
                details: error.message 
            })
        };
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
