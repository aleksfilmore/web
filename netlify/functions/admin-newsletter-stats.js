// Newsletter Stats - MailerLite Integration
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
        console.log('Fetching newsletter stats from MailerLite...');
        
        const apiKey = process.env.MAILERLITE_API_KEY;
        if (!apiKey) {
            throw new Error('MailerLite API key not configured');
        }
        
        // Fetch subscriber statistics
        const [statsResponse, subscribersResponse] = await Promise.all([
            fetch('https://api.mailerlite.com/api/v2/stats', {
                headers: {
                    'X-MailerLite-ApiKey': apiKey,
                    'Content-Type': 'application/json'
                }
            }),
            fetch('https://api.mailerlite.com/api/v2/subscribers?limit=1', {
                headers: {
                    'X-MailerLite-ApiKey': apiKey,
                    'Content-Type': 'application/json'
                }
            })
        ]);
        
        let stats = { subscribers: {}, campaigns: {} };
        let subscriberCount = 0;
        
        if (statsResponse.ok) {
            stats = await statsResponse.json();
        }
        
        if (subscribersResponse.ok) {
            const subscribersData = await subscribersResponse.json();
            subscriberCount = subscribersData.total || 0;
        }
        
        const newsletterStats = {
            totalSubscribers: subscriberCount || stats.subscribers?.total || 0,
            activeSubscribers: stats.subscribers?.active || 0,
            monthlyNew: stats.subscribers?.this_month || 0,
            openRate: stats.campaigns?.open_rate?.average || 0,
            clickRate: stats.campaigns?.click_rate?.average || 0,
            lastUpdated: new Date().toISOString()
        };
        
        console.log('Newsletter stats fetched successfully:', newsletterStats);
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(newsletterStats)
        };

    } catch (error) {
        console.error('Newsletter stats error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to fetch newsletter stats',
                details: error.message 
            })
        };
    }
};
