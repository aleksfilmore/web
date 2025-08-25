// Updated MailerLite data function using shared auth + current API (connect.mailerlite.com)
const fetch = require('node-fetch');
const MailerLiteService = require('../../mailerlite-integration');
const { requireAuth } = require('./utils/auth');

exports.handler = async (event) => {
    console.log('📧 MailerLite data request received');

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
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // Auth
    const authError = requireAuth(event);
    if (authError) return authError;

    try {
        if (!process.env.MAILERLITE_API_KEY) {
            return { statusCode: 200, headers, body: JSON.stringify({ error: 'MailerLite API not configured' }) };
        }

        const service = new MailerLiteService();
        const statsResult = await service.getStats();

        if (!statsResult.success) {
            return { statusCode: 502, headers, body: JSON.stringify({ error: 'Failed to fetch stats', details: statsResult.error }) };
        }

        const data = statsResult.data;
        // Load persisted bonus chapter stats
        let bonusStats = { bonusChaptersSent: 0, bonusChaptersFailed: 0 };
        try {
            const fs = require('fs');
            const path = require('path');
            const statsPath = path.join(__dirname, '../../data/bonus-chapter-stats.json');
            if (fs.existsSync(statsPath)) {
                bonusStats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
            }
        } catch (e) {
            console.warn('Failed to read bonus chapter stats:', e.message);
        }
        // Shape response to match existing front-end expectations (objects with value + change)
        const responsePayload = {
            totalSubscribers: { value: data.totalSubscribers || 0, change: '' },
            activeSubscribers: { value: data.activeSubscribers || data.totalSubscribers || 0, change: '' },
            openRate: { value: `${(data.openRate || 0).toFixed(1)}%`, change: '' },
            clickRate: { value: `${(data.clickRate || 0).toFixed(1)}%`, change: '' },
            bonusChaptersSent: bonusStats.bonusChaptersSent || 0,
            bonusChaptersFailed: bonusStats.bonusChaptersFailed || 0,
            recentActivity: data.recentActivity || []
        };

        return { statusCode: 200, headers, body: JSON.stringify(responsePayload) };
    } catch (error) {
        console.error('MailerLite data error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error', details: error.message, hint: 'Verify MAILERLITE_API_KEY and campaign permissions.' }) };
    }
};
