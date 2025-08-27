const fetch = require('node-fetch');
const { requireAuth } = require('./utils/auth');

const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const MAILERLITE_API_URL = 'https://api.mailerlite.com/api/v2';

exports.handler = async (event, context) => {
    console.log('📊 Exporting subscribers data');
    
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="subscribers.csv"'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: { ...headers, 'Content-Type': 'application/json' }, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
    // Standardized auth helper
    const authError = requireAuth(event);
    if (authError) return authError;

        let csvData = 'Email,Name,Status,Date Subscribed,Groups\n';

        if (!MAILERLITE_API_KEY) {
            // Generate mock CSV data
            const mockSubscribers = [
                ['reader1@example.com', 'Sarah Johnson', 'active', '2024-01-15', 'Newsletter'],
                ['reader2@example.com', 'Mike Chen', 'active', '2024-01-20', 'Newsletter'],
                ['reader3@example.com', 'Emma Wilson', 'active', '2024-02-01', 'Newsletter'],
                ['reader4@example.com', 'David Martinez', 'active', '2024-02-10', 'Newsletter'],
                ['reader5@example.com', 'Lisa Anderson', 'unsubscribed', '2024-01-05', 'Newsletter']
            ];

            mockSubscribers.forEach(subscriber => {
                csvData += `${subscriber[0]},${subscriber[1]},${subscriber[2]},${subscriber[3]},${subscriber[4]}\n`;
            });

            return {
                statusCode: 200,
                headers,
                body: csvData
            };
        }

        // Fetch all subscribers from MailerLite
        let allSubscribers = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
            const response = await fetch(`${MAILERLITE_API_URL}/subscribers?limit=1000&page=${page}`, {
                headers: {
                    'X-MailerLite-ApiKey': MAILERLITE_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch subscribers from MailerLite');
            }

            const data = await response.json();
            allSubscribers = allSubscribers.concat(data);
            
            // Check if there are more pages
            hasMore = data.length === 1000;
            page++;
        }

        // Convert to CSV
        allSubscribers.forEach(subscriber => {
            const email = subscriber.email || '';
            const name = subscriber.name || '';
            const status = subscriber.type || 'unknown';
            const dateSubscribed = subscriber.date_subscribe || '';
            const groups = subscriber.groups ? subscriber.groups.map(g => g.name).join(';') : '';
            
            // Escape commas in fields
            csvData += `"${email}","${name}","${status}","${dateSubscribed}","${groups}"\n`;
        });

        console.log(`Exported ${allSubscribers.length} subscribers`);

        return {
            statusCode: 200,
            headers,
            body: csvData
        };

    } catch (error) {
        console.error('Error exporting subscribers:', error);
        return {
            statusCode: 500,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};
