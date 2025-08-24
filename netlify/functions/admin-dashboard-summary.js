// Admin Dashboard Summary - Combines all analytics data
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { google } = require('googleapis');
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
        console.log('Fetching dashboard summary...');
        const qs = event.queryStringParameters || {};
        const days = parseInt(qs.days) || 30;
        const since = new Date(Date.now() - days * 86400000);

        // Section-specific lightweight responses (to reduce latency)
        if (qs.section === 'stripe') {
            const stripeData = await getStripeAnalytics(since);
            return { statusCode: 200, headers, body: JSON.stringify(stripeData) };
        }
        if (qs.section === 'audiobook' || qs.section === 'audiobook-listeners') {
            return { statusCode: 200, headers, body: JSON.stringify({ success: false, error: 'Audiobook analytics not yet implemented' }) };
        }
        if (qs.ga) {
            const ga = await getGoogleAnalyticsData(qs.ga, days).catch(e => ({ error: e.message }));
            return { statusCode: 200, headers, body: JSON.stringify(ga) };
        }

        // Full summary
        const [stripeData, newsletterData, gaSummary] = await Promise.all([
            getStripeAnalytics(since),
            getMailerLiteStats(),
            getGoogleAnalyticsData('stats', days).catch(() => null)
        ]);

        const dashboardData = {
            revenue: stripeData.revenue,
            orders: stripeData.orders,
            products: stripeData.products,
            newsletter: newsletterData,
            website: gaSummary?.stats || { pageViews: 0, users: 0, bounceRate: 0, averageSessionDuration: 0 },
            summary: {
                totalRevenue: stripeData.revenue.totalRevenue,
                totalOrders: stripeData.orders.length,
                websiteVisitors: gaSummary?.stats?.users || 0,
                newsletterSubscribers: newsletterData.totalSubscribers,
                generatedAt: new Date().toISOString()
            }
        };
        console.log('Dashboard summary generated successfully');
        return { statusCode: 200, headers, body: JSON.stringify(dashboardData) };

    } catch (error) {
        console.error('Dashboard summary error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to generate dashboard summary',
                details: error.message 
            })
        };
    }
};

async function getStripeAnalytics(since) {
    try {
        console.log('Fetching Stripe analytics...');
        
        // Get payments from the specified period
        const payments = await stripe.paymentIntents.list({
            created: {
                gte: Math.floor(since.getTime() / 1000)
            },
            limit: 100
        });

        // Get recent checkout sessions for detailed order info
        const sessions = await stripe.checkout.sessions.list({
            created: {
                gte: Math.floor(since.getTime() / 1000)
            },
            limit: 50
        });

        let totalRevenue = 0;
        let audiobookRevenue = 0;
        let bookRevenue = 0;
        let bundleRevenue = 0;
        
        const recentOrders = [];
        
        // Process successful payments
        payments.data.forEach(payment => {
            if (payment.status === 'succeeded') {
                const amount = payment.amount / 100; // Convert from cents
                totalRevenue += amount;
                
                // Try to categorize by metadata or amount
                if (payment.metadata?.product_type === 'audiobook' || amount <= 10) {
                    audiobookRevenue += amount;
                } else if (payment.metadata?.product_type === 'signed-book' || (amount > 10 && amount <= 20)) {
                    bookRevenue += amount;
                } else if (payment.metadata?.product_type === 'bundle' || amount > 20) {
                    bundleRevenue += amount;
                }
            }
        });
        
        // Process sessions for order details
        sessions.data.forEach(session => {
            if (session.payment_status === 'paid') {
                recentOrders.push({
                    id: session.id,
                    customer: {
                        name: session.customer_details?.name || 'Unknown',
                        email: session.customer_details?.email || session.customer_email
                    },
                    amount: session.amount_total / 100,
                    status: determineOrderStatus(session),
                    date: new Date(session.created * 1000).toISOString(),
                    products: parseSessionProducts(session)
                });
            }
        });
        
        return {
            revenue: {
                totalRevenue,
                audiobookRevenue,
                bookRevenue,
                bundleRevenue,
                transactionCount: payments.data.filter(p => p.status === 'succeeded').length
            },
            orders: recentOrders.slice(0, 10), // Most recent 10 orders
            products: {
                audiobook: { sales: audiobookRevenue, count: 0 },
                book: { sales: bookRevenue, count: 0 },
                bundle: { sales: bundleRevenue, count: 0 }
            }
        };
        
    } catch (error) {
        console.error('Stripe analytics error:', error);
        throw new Error('Failed to fetch Stripe analytics: ' + error.message);
    }
}

async function getMailerLiteStats() {
    try {
        console.log('Fetching MailerLite stats...');
        
        const apiKey = process.env.MAILERLITE_API_KEY;
        if (!apiKey) {
            throw new Error('MailerLite API key not configured');
        }
        
        // Fetch subscriber stats from MailerLite
        const response = await fetch('https://api.mailerlite.com/api/v2/stats', {
            headers: {
                'X-MailerLite-ApiKey': apiKey,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`MailerLite API error: ${response.status}`);
        }
        
        const stats = await response.json();
        
        return {
            totalSubscribers: stats.subscribers?.total || 0,
            activeSubscribers: stats.subscribers?.active || 0,
            monthlyNew: stats.subscribers?.this_month || 0,
            openRate: stats.campaigns?.open_rate?.average || 0
        };
        
    } catch (error) {
        console.error('MailerLite stats error:', error);
        // Return fallback data if MailerLite fails
        return {
            totalSubscribers: 0,
            activeSubscribers: 0,
            monthlyNew: 0,
            openRate: 0,
            error: error.message
        };
    }
}

function determineOrderStatus(session) {
    // Check if order has physical products that need shipping
    const hasPhysical = session.metadata?.has_physical === 'true' || 
                       session.shipping_details?.address;
    
    if (!hasPhysical) {
        return 'digital_delivered';
    }
    
    // For physical orders, check age
    const orderDate = new Date(session.created * 1000);
    const daysSinceOrder = (new Date() - orderDate) / (1000 * 60 * 60 * 24);
    
    return daysSinceOrder > 7 ? 'shipped' : 'pending_fulfillment';
}

function parseSessionProducts(session) {
    // Try to parse products from metadata
    if (session.metadata?.cart_items) {
        try {
            return JSON.parse(session.metadata.cart_items);
        } catch (e) {
            console.warn('Failed to parse cart items from session metadata');
        }
    }
    
    // Fallback: guess from amount
    const amount = session.amount_total / 100;
    if (amount <= 10) {
        return [{ id: 'audiobook', quantity: 1 }];
    } else if (amount <= 20) {
        return [{ id: 'signed-book', quantity: 1 }];
    } else {
        return [{ id: 'bundle', quantity: 1 }];
    }
}

// Google Analytics via service account env vars
async function getGoogleAnalyticsData(kind, days) {
    const propertyId = process.env.GA_PROPERTY_ID;
    const clientEmail = process.env.GA_CLIENT_EMAIL;
    const privateKey = (process.env.GA_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    if (!propertyId || !clientEmail || !privateKey) {
        return { disabled: true, reason: 'GA env vars missing' };
    }
    const scopes = ['https://www.googleapis.com/auth/analytics.readonly'];
    const jwt = new google.auth.JWT(clientEmail, null, privateKey, scopes);
    await jwt.authorize();
    const analyticsData = google.analyticsdata('v1beta');
    const endDate = 'today';
    const startDate = `${days}daysAgo`;

    if (kind === 'stats') {
        const resp = await analyticsData.properties.runReport({
            auth: jwt,
            property: `properties/${propertyId}`,
            requestBody: {
                dateRanges: [{ startDate, endDate }],
                metrics: [
                    { name: 'screenPageViews' },
                    { name: 'totalUsers' },
                    { name: 'bounceRate' },
                    { name: 'averageSessionDuration' }
                ]
            }
        });
        const row = resp.data.rows?.[0]?.metricValues || [];
        return {
            stats: {
                pageViews: Number(row[0]?.value || 0),
                users: Number(row[1]?.value || 0),
                bounceRate: Number(row[2]?.value || 0),
                averageSessionDuration: Number(row[3]?.value || 0)
            }
        };
    }
    if (kind === 'top-pages') {
        const resp = await analyticsData.properties.runReport({
            auth: jwt,
            property: `properties/${propertyId}`,
            requestBody: {
                dateRanges: [{ startDate, endDate }],
                dimensions: [{ name: 'pagePath' }],
                metrics: [{ name: 'screenPageViews' }],
                limit: 10,
                orderBys: [{ desc: true, metric: { metricName: 'screenPageViews' } }]
            }
        });
        return resp.data.rows?.map(r => ({ path: r.dimensionValues[0].value, pageviews: Number(r.metricValues[0].value) })) || [];
    }
    if (kind === 'traffic') {
        // Basic traffic sources placeholder (requires channel grouping dimension; GA4 may differ)
        return [];
    }
    if (kind === 'realtime') {
        // GA4 realtime requires different endpoint; placeholder
        return { activeUsers: 0 };
    }
    return { error: 'Unknown GA request' };
}
