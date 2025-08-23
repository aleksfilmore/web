// Newsletter Subscribe Function for Netlify
const MailerLiteService = require('../../mailerlite-integration');

exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { email, source = 'website' } = JSON.parse(event.body);

        if (!email || !email.includes('@')) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Valid email address required' })
            };
        }

        // Initialize MailerLite service
        const mailerLite = new MailerLiteService();
        
        // Subscribe to newsletter with welcome email
        const result = await mailerLite.addSubscriberWithWelcome(email, '', {
            source: source,
            subscribed_at: new Date().toISOString(),
            ip_address: event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown'
        });

        console.log('Newsletter subscription successful:', { email, source });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Successfully subscribed to newsletter',
                result: result
            })
        };

    } catch (error) {
        console.error('Newsletter subscription error:', error);
        
        // Handle specific MailerLite errors
        if (error.response?.data?.errors) {
            const errorMessage = error.response.data.errors[0]?.message || 'Subscription failed';
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: errorMessage,
                    details: error.response.data.errors
                })
            };
        }

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to subscribe to newsletter',
                message: error.message
            })
        };
    }
};
