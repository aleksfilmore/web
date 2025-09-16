// Newsletter Subscribe Function for Vercel
const MailerLiteService = require('../../mailerlite-integration.js');

module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, source = 'website' } = req.body || {};

        if (!email || !email.includes('@')) {
            return res.status(400).json({ error: 'Valid email address required' });
        }

        // Initialize MailerLite service
        const mailerLite = new MailerLiteService();
        
        // Subscribe to newsletter with welcome email
        const result = await mailerLite.addSubscriberWithWelcome(email, '', {
            source: source,
            subscribed_at: new Date().toISOString(),
            ip_address: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
        });

        console.log('Newsletter subscription successful:', { email, source });

        return res.status(200).json({ 
            success: true, 
            message: 'Successfully subscribed to newsletter',
            result: result
        });

    } catch (error) {
        console.error('Newsletter subscription error:', error);
        
        // Handle specific MailerLite errors
        if (error.response?.data?.errors) {
            const errorMessage = error.response.data.errors[0]?.message || 'Subscription failed';
            return res.status(400).json({ 
                error: errorMessage,
                details: error.response.data.errors
            });
        }

        return res.status(500).json({ 
            error: 'Failed to subscribe to newsletter',
            message: error.message
        });
    }
}