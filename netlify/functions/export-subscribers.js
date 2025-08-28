const fetch = require('node-fetch');
const { requireAuth } = require('./utils/auth');

const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const MAILERLITE_API_URL = 'https://api.mailerlite.com/api/v2';

exports.handler = async (event, context) => {
    console.log('📊 Exporting subscribers data');

    // Default CSV download headers
    const csvHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="subscribers.csv"'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers: { ...csvHeaders, 'Content-Type': 'application/json' }, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers: { ...csvHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Auth check
        const authError = requireAuth(event);
        if (authError) return authError;

        if (!MAILERLITE_API_KEY) {
            console.error('MAILERLITE_API_KEY not configured for export-subscribers function');
            return {
                statusCode: 503,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify({ error: 'MailerLite API key not configured on server. Set MAILERLITE_API_KEY to enable subscriber export.' })
            };
        }

        // Fetch all subscribers from MailerLite (paged)
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
            if (!Array.isArray(data)) break;
            allSubscribers = allSubscribers.concat(data);
            hasMore = data.length === 1000;
            page++;
        }

        // Convert to CSV
        let csvData = '"Email","Name","Status","Date Subscribed","Groups"\n';
        allSubscribers.forEach(subscriber => {
            const email = subscriber.email || '';
            const name = (subscriber.name || '').replace(/"/g, '""');
            const status = subscriber.type || '';
            const dateSubscribed = subscriber.date_subscribe || subscriber.date || '';
            const groups = subscriber.groups ? subscriber.groups.map(g => g.name).join(';') : '';
            const safeGroups = (groups || '').replace(/"/g, '""');

            csvData += `"${email}","${name}","${status}","${dateSubscribed}","${safeGroups}"\n`;
        });

        console.log(`Exported ${allSubscribers.length} subscribers`);

        return {
            statusCode: 200,
            headers: csvHeaders,
            body: csvData
        };

    } catch (error) {
        console.error('Error exporting subscribers:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Failed to fetch subscribers from MailerLite', details: error.message })
        };
    }
};
