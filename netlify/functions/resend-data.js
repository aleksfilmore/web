const { Resend } = require('resend');
const FROM_EMAIL = process.env.FROM_EMAIL || 'Aleks Filmore <aleksfilmore@gmail.com>';
const { requireAuth } = require('./utils/auth');
let resend; // lazy init inside handler

exports.handler = async (event, context) => {
    console.log('📧 Resend data request received');
    
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Standardized auth helper
    const authError = requireAuth(event);
    if (authError) return authError;

    try {
        // Lazy initialize Resend client (avoids crash when RESEND_API_KEY missing at require-time)
        if (!resend) resend = new Resend(process.env.RESEND_API_KEY || '');
        if (event.httpMethod === 'GET') {
            // Get email statistics and recent emails
            console.log('Fetching Resend email data...');
            
            // Note: Resend doesn't have a direct API to list sent emails
            // But we can provide the functionality to send emails and track basic stats
            const emailStats = {
                service: 'Resend',
                status: 'Connected',
                apiKey: process.env.RESEND_API_KEY ? 'Configured' : 'Missing',
                domain: 'aleksfilmore.com',
                lastCheck: new Date().toISOString(),
                capabilities: [
                    'Transactional emails',
                    'Audiobook token delivery',
                    'Order confirmations',
                    'System notifications'
                ]
            };

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    data: emailStats,
                    timestamp: new Date().toISOString()
                })
            };

        } else if (event.httpMethod === 'POST') {
            // Send test email or specific email
            const { action, recipient, subject, content, template } = JSON.parse(event.body || '{}');
            
            if (action === 'test') {
                console.log('Sending test email via Resend...');
                
                    const { data, error } = await resend.emails.send({
                        from: FROM_EMAIL,
                        to: String(recipient),
                    subject: subject || 'Test Email from Admin Panel',
                    html: content || `
                        <h2>🎉 Admin Panel Test Email</h2>
                        <p>This is a test email sent from your admin panel at ${new Date().toLocaleString()}.</p>
                        <p>If you're seeing this, your Resend integration is working perfectly!</p>
                        <br>
                        <p>Best regards,<br>Admin System</p>
                    `
                });

                if (error) {
                    console.error('Resend error:', error);
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: error.message })
                    };
                }

                console.log('Test email sent successfully:', data);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        message: 'Test email sent successfully',
                        emailId: data.id,
                        timestamp: new Date().toISOString()
                    })
                };

            } else if (action === 'resend_audiobook') {
                // Resend audiobook access to a customer
                const { email, token } = JSON.parse(event.body || '{}');
                
                if (!email || !token) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: 'Email and token are required' })
                    };
                }

                console.log(`Resending audiobook access to: ${email}`);
                
                const accessUrl = `https://aleksfilmore.com/audiobook-player.html?token=${token}&email=${encodeURIComponent(email)}`;
                
                    const { data, error } = await resend.emails.send({
                        from: FROM_EMAIL,
                        to: String(email),
                    subject: '🎧 Your Audiobook Access - The Worst Boyfriends Ever',
                    html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Your Audiobook Access</title>
                        </head>
                        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7f3ed; color: #2d2d2d;">
                            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 16px; overflow: hidden;">
                                <div style="background: linear-gradient(135deg, #FF3B3B 0%, #e63946 100%); padding: 2rem; text-align: center;">
                                    <h1 style="margin: 0; color: white; font-size: 2rem; font-weight: 700;">🎧 Your Audiobook is Ready!</h1>
                                </div>
                                
                                <div style="padding: 3rem 2rem; color: #C7CDD4;">
                                    <p style="font-size: 1.2rem; margin: 0 0 2rem 0; line-height: 1.6;">
                                        Hey there! 👋
                                    </p>
                                    
                                    <p style="font-size: 1.1rem; margin: 0 0 2rem 0; line-height: 1.6;">
                                        Your audiobook access has been resent. Click the link below to start listening to "The Worst Boyfriends Ever"!
                                    </p>
                                    
                                    <div style="text-align: center; margin: 3rem 0;">
                                        <a href="${accessUrl}" style="background: linear-gradient(135deg, #FF3B3B 0%, #e63946 100%); color: white; padding: 1.2rem 2.5rem; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 1.1rem; display: inline-block;">
                                            🎧 Listen Now
                                        </a>
                                    </div>
                                    
                                    <p style="font-size: 1rem; margin: 2rem 0 0 0; line-height: 1.6; color: #9CA3AF;">
                                        Save this email! You can return to listen anytime using this link.
                                    </p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `
                });

                if (error) {
                    console.error('Resend audiobook error:', error);
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ error: error.message })
                    };
                }

                console.log('Audiobook access resent successfully:', data);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({
                        success: true,
                        message: 'Audiobook access resent successfully',
                        emailId: data.id,
                        timestamp: new Date().toISOString()
                    })
                };
            }

            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Invalid action' })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Resend data error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Failed to process Resend request',
                details: error.message 
            })
        };
    }
};
