const fetch = require('node-fetch');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('./utils/auth');
const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MAILERLITE_API_URL = 'https://api.mailerlite.com/api/v2';

const resend = new Resend(RESEND_API_KEY);

exports.handler = async (event, context) => {
    console.log('📧 Sending newsletter to all subscribers');
    
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const authError = requireAuth(event);
        if (authError) return authError;

        // Newsletter template
        const newsletterHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Latest Updates from Alexandra Rodica</title>
            <style>
                body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; background: #f8f9fa; }
                .container { max-width: 600px; margin: 0 auto; background: white; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
                .content { padding: 40px 30px; }
                .section { margin-bottom: 30px; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                .book-cover { width: 150px; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
                .footer { background: #f8f9fa; padding: 30px; text-align: center; font-size: 14px; color: #666; border-top: 1px solid #eee; }
                .social-links { margin: 20px 0; }
                .social-links a { margin: 0 10px; text-decoration: none; color: #667eea; }
                .quote { font-style: italic; background: #f8f9fa; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📚 Latest from Alexandra Rodica</h1>
                    <p>Your monthly dose of dating disasters, book updates, and exclusive content</p>
                </div>
                
                <div class="content">
                    <div class="section">
                        <h2>🎉 Thank You for Your Amazing Support!</h2>
                        <p>Dear amazing readers,</p>
                        <p>I can't believe the incredible response to "The Worst Boyfriends Ever"! Your reviews, messages, and shared stories have been absolutely wonderful. It's so heartwarming to know that my dating disasters are bringing joy (and validation) to so many of you.</p>
                    </div>

                    <div class="section">
                        <h2>📖 What's New This Month</h2>
                        <div style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 300px;">
                                <h3>New Audiobook Features</h3>
                                <p>The audiobook version now includes bonus commentary and behind-the-scenes stories that didn't make it into the original book. Plus, I've added chapter markers for easy navigation!</p>
                                <a href="https://alexandrarodica.com/audiobook.html" class="button">🎧 Listen Now</a>
                            </div>
                        </div>
                    </div>

                    <div class="quote">
                        <p>"Your book made me realize I'm not alone in my terrible dating experiences. Thank you for the laughs and the validation!" - Sarah M., Reader</p>
                    </div>

                    <div class="section">
                        <h2>💌 Exclusive for Newsletter Subscribers</h2>
                        <p>As a thank you for being part of our community, here's what's coming up exclusively for you:</p>
                        <ul>
                            <li><strong>Bonus Chapter:</strong> "The One That Got Away (Thank God)" - coming next week!</li>
                            <li><strong>Early Access:</strong> Be the first to know about new projects and releases</li>
                            <li><strong>Reader Q&A:</strong> Submit your worst dating stories for a chance to be featured</li>
                        </ul>
                    </div>

                    <div class="section">
                        <h2>🎯 What I'm Working On</h2>
                        <p>I'm excited to share that I'm working on something new! While I can't reveal all the details yet, let's just say it involves more cringe-worthy stories and lessons learned the hard way. Stay tuned!</p>
                    </div>

                    <div class="section">
                        <h2>📱 Connect With Me</h2>
                        <p>I love hearing from you! Share your own dating disaster stories or just say hi:</p>
                        <div class="social-links">
                            <a href="#">📧 Email</a>
                            <a href="#">📷 Instagram</a>
                            <a href="#">🎵 TikTok</a>
                            <a href="#">🎵 Spotify</a>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <p><strong>Alexandra Rodica</strong></p>
                    <p>Author of "The Worst Boyfriends Ever"</p>
                    <p style="margin-top: 20px; font-size: 12px;">
                        You're receiving this because you subscribed to our newsletter. 
                        <a href="#">Unsubscribe</a> | <a href="#">Update preferences</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        `;

        let sent = 0;
        let failed = 0;

        if (!MAILERLITE_API_KEY || !RESEND_API_KEY) {
            // Simulate sending for demo
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Newsletter sending simulation completed',
                    stats: {
                        sent: 2847,
                        failed: 0,
                        timestamp: new Date().toISOString()
                    },
                    note: 'This is a simulation. Configure MailerLite and Resend APIs for actual sending.'
                })
            };
        }

        // Get all subscribers from MailerLite
        const subscribersResponse = await fetch(`${MAILERLITE_API_URL}/subscribers?limit=1000`, {
            headers: {
                'X-MailerLite-ApiKey': MAILERLITE_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (!subscribersResponse.ok) {
            throw new Error('Failed to fetch subscribers from MailerLite');
        }

        const subscribers = await subscribersResponse.json();
        console.log(`Found ${subscribers.length} subscribers`);

        // Send newsletter to all subscribers in batches
        const batchSize = 10;
        for (let i = 0; i < subscribers.length; i += batchSize) {
            const batch = subscribers.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (subscriber) => {
                try {
                    if (subscriber.type === 'active') {
                        await resend.emails.send({
                            from: 'alexandra@alexandrarodica.com',
                            to: subscriber.email,
                            subject: '📚 Latest Updates & Exclusive Content Inside!',
                            html: newsletterHtml
                        });
                        sent++;
                    }
                } catch (error) {
                    console.error(`Failed to send to ${subscriber.email}:`, error);
                    failed++;
                }
            });

            await Promise.all(batchPromises);
            
            // Small delay between batches to avoid rate limiting
            if (i + batchSize < subscribers.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Persist campaign stats (append to a log file for history)
        try {
            const logPath = path.join(__dirname, '../../data/newsletter-campaigns.json');
            let campaigns = [];
            if (fs.existsSync(logPath)) {
                try { campaigns = JSON.parse(fs.readFileSync(logPath, 'utf8')); } catch {}
            }
            campaigns.unshift({
                id: Date.now(),
                sent,
                failed,
                total: subscribers.length,
                subject: '📚 Latest Updates & Exclusive Content Inside!',
                timestamp: new Date().toISOString()
            });
            campaigns = campaigns.slice(0, 50); // keep last 50
            fs.writeFileSync(logPath, JSON.stringify(campaigns, null, 2));
        } catch (persistErr) {
            console.warn('Failed to persist newsletter campaign stats:', persistErr.message);
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Newsletter sent successfully',
                stats: {
                    sent,
                    failed,
                    total: subscribers.length,
                    timestamp: new Date().toISOString()
                }
            })
        };

    } catch (error) {
        console.error('Error sending newsletter:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};
