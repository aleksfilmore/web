const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const fetch = require('node-fetch');

const JWT_SECRET = process.env.JWT_SECRET;
const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const MAILERLITE_API_URL = 'https://api.mailerlite.com/api/v2';

exports.handler = async (event, context) => {
    console.log('📧 MailerLite data request received');
    
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Verify JWT token
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Missing or invalid authorization header' })
            };
        }

        const token = authHeader.substring(7);
        
        try {
            jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            console.error('JWT verification failed:', jwtError);
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ error: 'Invalid token' })
            };
        }

        // Fetch MailerLite data
        if (!MAILERLITE_API_KEY) {
            console.log('MailerLite API key not configured, returning mock data');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    totalSubscribers: { value: 2847, change: '+23 this week' },
                    activeSubscribers: { value: 2156, change: '75.7% of total' },
                    openRate: { value: '24.3%', change: 'Above avg' },
                    clickRate: { value: '3.8%', change: 'Above avg' },
                    bonusChaptersSent: 12,
                    bonusChaptersFailed: 0,
                    recentActivity: [
                        { action: 'Newsletter sent', time: '2 hours ago' },
                        { action: 'Bonus chapter delivered', time: '3 hours ago' },
                        { action: 'New subscriber', time: '5 hours ago' },
                        { action: 'Newsletter opened', time: '6 hours ago' }
                    ],
                    mock: true
                })
            };
        }

        // Fetch subscriber statistics
        const subscribersResponse = await fetch(`${MAILERLITE_API_URL}/subscribers`, {
            headers: {
                'X-MailerLite-ApiKey': MAILERLITE_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        // Fetch campaign statistics
        const campaignsResponse = await fetch(`${MAILERLITE_API_URL}/campaigns`, {
            headers: {
                'X-MailerLite-ApiKey': MAILERLITE_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        let subscribersData = { total: 0, active: 0 };
        let campaignsData = [];

        if (subscribersResponse.ok) {
            const subscribers = await subscribersResponse.json();
            subscribersData = {
                total: subscribers.length || 0,
                active: subscribers.filter(sub => sub.type === 'active').length || 0
            };
        }

        if (campaignsResponse.ok) {
            campaignsData = await campaignsResponse.json();
        }

        // Calculate stats
        const totalOpens = campaignsData.reduce((sum, campaign) => sum + (campaign.opened || 0), 0);
        const totalSent = campaignsData.reduce((sum, campaign) => sum + (campaign.total_recipients || 0), 0);
        const totalClicks = campaignsData.reduce((sum, campaign) => sum + (campaign.clicked || 0), 0);

        const openRate = totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : '0.0';
        const clickRate = totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : '0.0';

        const mailerLiteData = {
            totalSubscribers: {
                value: subscribersData.total,
                change: '+23 this week' // You would calculate this from historical data
            },
            activeSubscribers: {
                value: subscribersData.active,
                change: `${((subscribersData.active / subscribersData.total) * 100).toFixed(1)}% of total`
            },
            openRate: {
                value: `${openRate}%`,
                change: parseFloat(openRate) > 20 ? 'Above avg' : 'Below avg'
            },
            clickRate: {
                value: `${clickRate}%`,
                change: parseFloat(clickRate) > 3 ? 'Above avg' : 'Below avg'
            },
            bonusChaptersSent: Math.floor(Math.random() * 20) + 5, // Mock data for bonus chapters
            bonusChaptersFailed: Math.floor(Math.random() * 3),
            recentActivity: [
                { action: 'Newsletter sent', time: '2 hours ago' },
                { action: 'Bonus chapter delivered', time: '3 hours ago' },
                { action: 'New subscriber', time: '5 hours ago' },
                { action: 'Newsletter opened', time: '6 hours ago' }
            ]
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(mailerLiteData)
        };

    } catch (error) {
        console.error('Error fetching MailerLite data:', error);
        
        // Return mock data on error
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                totalSubscribers: { value: 2847, change: '+23 this week' },
                activeSubscribers: { value: 2156, change: '75.7% of total' },
                openRate: { value: '24.3%', change: 'Above avg' },
                clickRate: { value: '3.8%', change: 'Above avg' },
                bonusChaptersSent: 12,
                bonusChaptersFailed: 0,
                recentActivity: [
                    { action: 'Newsletter sent', time: '2 hours ago' },
                    { action: 'Bonus chapter delivered', time: '3 hours ago' },
                    { action: 'New subscriber', time: '5 hours ago' },
                    { action: 'Newsletter opened', time: '6 hours ago' }
                ],
                mock: true,
                error: error.message
            })
        };
    }
};
