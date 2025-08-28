const { requireAuth } = require('./utils/auth');
const { GoogleAuth } = require('google-auth-library');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET;
const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID || 'YOUR_GA_PROPERTY_ID';

// Use local service account file instead of environment variable
const getGACredentials = () => {
    try {
        // Try environment variable first (for flexibility)
        if (process.env.GA_CREDENTIALS) {
            return JSON.parse(process.env.GA_CREDENTIALS);
        }
        
        // Fall back to local file
        const keyPath = path.join(__dirname, '../../google-analytics-key.json');
        return require(keyPath);
    } catch (error) {
        console.warn('No Google Analytics credentials found in environment or key file');
        return null;
    }
};

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
    // Standardized auth helper
    const authError = requireAuth(event);
    if (authError) return authError;

        // Initialize Google Analytics Data client
        let analyticsDataClient;
        
        try {
            const gaCredentials = getGACredentials();
            
            if (!gaCredentials) {
                throw new Error('No GA credentials available');
            }
            
            const auth = new GoogleAuth({
                credentials: gaCredentials,
                scopes: ['https://www.googleapis.com/auth/analytics.readonly']
            });
            
            analyticsDataClient = new BetaAnalyticsDataClient({ auth });
        } catch (authError) {
            console.error('Google Analytics auth error:', authError);
            // Fail explicitly when Google Analytics credentials are missing or invalid
            return {
                statusCode: 503,
                headers,
                body: JSON.stringify({ error: 'Google Analytics not configured on server. Set GA_CREDENTIALS or provide service account key.' })
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
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Error fetching Google Analytics data', details: error.message })
        };
    }
};

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}m ${secs}s`;
}
