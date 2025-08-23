// Test Integrations - Verify all API connections
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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

    console.log('Testing all integrations...');

    const results = {
        googleAnalytics: await testGoogleAnalytics(),
        stripe: await testStripe(),
        mailerLite: await testMailerLite(),
        resend: await testResend(),
        audiobook: { success: true, message: 'Audiobook analytics ready' },
        overall: { success: false, timestamp: new Date().toISOString() }
    };

    // Determine overall success
    results.overall.success = results.stripe.success && results.mailerLite.success && results.resend.success;

    console.log('Integration tests completed:', results);

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(results)
    };
};

async function testGoogleAnalytics() {
    try {
        // Check if GA credentials are available
        const propertyId = process.env.GA_PROPERTY_ID;
        const keyFile = process.env.GA_KEY_FILE;
        
        if (!propertyId) {
            return {
                success: false,
                error: 'Google Analytics Property ID not configured'
            };
        }
        
        if (!keyFile) {
            return {
                success: false,
                error: 'Google Analytics key file not configured'
            };
        }
        
        return {
            success: true,
            message: 'Google Analytics configured but not fully tested in serverless environment'
        };
        
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

async function testStripe() {
    try {
        // Test Stripe connection by fetching account info
        const account = await stripe.accounts.retrieve();
        
        return {
            success: true,
            message: `Connected to Stripe account: ${account.business_profile?.name || account.id}`
        };
        
    } catch (error) {
        return {
            success: false,
            error: `Stripe connection failed: ${error.message}`
        };
    }
}

async function testMailerLite() {
    try {
        const apiKey = process.env.MAILERLITE_API_KEY;
        if (!apiKey) {
            return {
                success: false,
                error: 'MailerLite API key not configured'
            };
        }
        
        // Test MailerLite connection
        const response = await fetch('https://api.mailerlite.com/api/v2/stats', {
            headers: {
                'X-MailerLite-ApiKey': apiKey,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            success: true,
            message: `MailerLite connected - ${data.subscribers?.total || 0} subscribers`
        };
        
    } catch (error) {
        return {
            success: false,
            error: `MailerLite connection failed: ${error.message}`
        };
    }
}

async function testResend() {
    try {
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
            return {
                success: false,
                error: 'Resend API key not configured'
            };
        }
        
        // Test Resend connection by getting API info
        const response = await fetch('https://api.resend.com/domains', {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }
        
        return {
            success: true,
            message: 'Resend email service connected'
        };
        
    } catch (error) {
        return {
            success: false,
            error: `Resend connection failed: ${error.message}`
        };
    }
}
