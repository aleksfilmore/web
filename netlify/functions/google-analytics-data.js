const jwt = require('jsonwebtoken');
const { GoogleAuth } = require('google-auth-library');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');

const JWT_SECRET = process.env.JWT_SECRET;
const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID || 'YOUR_GA_PROPERTY_ID';
const GA_CREDENTIALS = JSON.parse(process.env.GA_CREDENTIALS || '{}');

exports.handler = async (event, context) => {
    console.log('📊 Google Analytics data request received');
    
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

        // Initialize Google Analytics Data client
        let analyticsDataClient;
        
        try {
            const auth = new GoogleAuth({
                credentials: GA_CREDENTIALS,
                scopes: ['https://www.googleapis.com/auth/analytics.readonly']
            });
            
            analyticsDataClient = new BetaAnalyticsDataClient({ auth });
        } catch (authError) {
            console.error('Google Analytics auth error:', authError);
            // Return mock data if GA not configured
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    pageViews: { value: 12847, change: '+15.3%' },
                    uniqueVisitors: { value: 8934, change: '+8.7%' },
                    bounceRate: { value: '42.5%', change: '-2.1%' },
                    sessionDuration: { value: '2m 34s', change: '+12.5%' },
                    topPages: [
                        { page: '/', views: 2847 },
                        { page: '/audiobook.html', views: 1234 },
                        { page: '/shop.html', views: 892 },
                        { page: '/about.html', views: 567 },
                        { page: '/contact.html', views: 234 }
                    ],
                    trafficSources: [
                        { source: 'Organic Search', percentage: 45 },
                        { source: 'Direct', percentage: 30 },
                        { source: 'Social Media', percentage: 25 }
                    ],
                    mock: true
                })
            };
        }

        // Fetch analytics data
        const [pageViewsResponse] = await analyticsDataClient.runReport({
            property: `properties/${GA_PROPERTY_ID}`,
            dateRanges: [
                {
                    startDate: '30daysAgo',
                    endDate: 'today',
                },
            ],
            metrics: [
                { name: 'screenPageViews' },
                { name: 'sessions' },
                { name: 'bounceRate' },
                { name: 'averageSessionDuration' }
            ],
            dimensions: [
                { name: 'pagePath' }
            ],
            orderBys: [
                {
                    metric: { metricName: 'screenPageViews' },
                    desc: true
                }
            ],
            limit: 10
        });

        // Process the data
        const analyticsData = {
            pageViews: {
                value: parseInt(pageViewsResponse.rows?.[0]?.metricValues?.[0]?.value || '0'),
                change: '+15.3%' // You would calculate this from comparison data
            },
            uniqueVisitors: {
                value: parseInt(pageViewsResponse.rows?.[0]?.metricValues?.[1]?.value || '0'),
                change: '+8.7%'
            },
            bounceRate: {
                value: (parseFloat(pageViewsResponse.rows?.[0]?.metricValues?.[2]?.value || '0') * 100).toFixed(1) + '%',
                change: '-2.1%'
            },
            sessionDuration: {
                value: formatDuration(parseFloat(pageViewsResponse.rows?.[0]?.metricValues?.[3]?.value || '0')),
                change: '+12.5%'
            },
            topPages: pageViewsResponse.rows?.slice(0, 5).map(row => ({
                page: row.dimensionValues[0].value,
                views: parseInt(row.metricValues[0].value)
            })) || [],
            trafficSources: [
                { source: 'Organic Search', percentage: 45 },
                { source: 'Direct', percentage: 30 },
                { source: 'Social Media', percentage: 25 }
            ]
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(analyticsData)
        };

    } catch (error) {
        console.error('Error fetching Google Analytics data:', error);
        
        // Return mock data on error
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                pageViews: { value: 12847, change: '+15.3%' },
                uniqueVisitors: { value: 8934, change: '+8.7%' },
                bounceRate: { value: '42.5%', change: '-2.1%' },
                sessionDuration: { value: '2m 34s', change: '+12.5%' },
                topPages: [
                    { page: '/', views: 2847 },
                    { page: '/audiobook.html', views: 1234 },
                    { page: '/shop.html', views: 892 },
                    { page: '/about.html', views: 567 },
                    { page: '/contact.html', views: 234 }
                ],
                trafficSources: [
                    { source: 'Organic Search', percentage: 45 },
                    { source: 'Direct', percentage: 30 },
                    { source: 'Social Media', percentage: 25 }
                ],
                mock: true,
                error: error.message
            })
        };
    }
};

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}m ${secs}s`;
}
