const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const { Resend } = require('resend');

const JWT_SECRET = process.env.JWT_SECRET;
const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MAILERLITE_API_URL = 'https://api.mailerlite.com/api/v2';

const resend = new Resend(RESEND_API_KEY);

exports.handler = async (event, context) => {
    console.log('📖 Sending bonus chapter to all subscribers');
    
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

        // Bonus chapter email template
        const bonusChapterHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>🎁 Exclusive Bonus Chapter: "The One That Got Away (Thank God)"</title>
            <style>
                body { font-family: 'Georgia', serif; line-height: 1.6; color: #333; background: #f8f9fa; }
                .container { max-width: 600px; margin: 0 auto; background: white; }
                .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 40px 30px; text-align: center; }
                .content { padding: 40px 30px; }
                .chapter-content { background: #f8f9fa; padding: 30px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff6b6b; }
                .button { display: inline-block; background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                .footer { background: #f8f9fa; padding: 30px; text-align: center; font-size: 14px; color: #666; border-top: 1px solid #eee; }
                .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎁 EXCLUSIVE BONUS CHAPTER</h1>
                    <h2>"The One That Got Away (Thank God)"</h2>
                    <p>A story so cringe, it didn't make it into the main book...</p>
                </div>
                
                <div class="content">
                    <div class="warning">
                        <strong>⚠️ Reader Discretion Advised:</strong> This chapter contains peak secondhand embarrassment and questionable life choices.
                    </div>

                    <p>Dear brave reader,</p>
                    
                    <p>You asked for it, and here it is – the story that was "too much" even for a book about the worst boyfriends ever. This is the tale of Marcus, also known as "The One I Almost Married But Didn't Because The Universe Has a Sense of Humor."</p>

                    <div class="chapter-content">
                        <h3>Chapter 21: The One That Got Away (Thank God)</h3>
                        
                        <p><em>Setting: A coffee shop in downtown, three years ago. I'm wearing my "good" jeans and actually brushed my hair. Red flag #1: I was trying too hard.</em></p>

                        <p>Marcus walked into Starbucks like he owned the place. Not in a confident way, but literally like he expected free coffee because his mere presence graced their establishment. He was tall, had that messy-but-intentional hair, and was wearing a vintage band t-shirt that I later learned cost $200. Because apparently, looking broke is expensive.</p>

                        <p>"Nice book," he said, sliding into the seat across from me uninvited. I was reading "Pride and Prejudice" for the fourth time because I'm basic like that.</p>

                        <p>"Thanks," I replied, immediately closing it because God forbid I seem too intellectual on a Tuesday afternoon.</p>

                        <p>"I'm more of a Bukowski guy myself," he continued, and I should have run right then. Any man who volunteers his love for Charles Bukowski within the first thirty seconds of conversation is telling you exactly who he is. Believe him.</p>

                        <p>But did I listen to my instincts? Of course not. I was charmed by his "mysterious artist" vibe and the way he ordered his coffee – black, no sugar, with the kind of dramatic sigh that suggested caffeine was both his salvation and his curse.</p>

                        <p>Three months later, I discovered that Marcus was:</p>
                        <ul>
                            <li>A "freelance creative" (unemployed)</li>
                            <li>Living in his ex-girlfriend's basement (while she lived upstairs)</li>
                            <li>Convinced that showering more than twice a week was "giving in to societal pressure"</li>
                            <li>The proud owner of seventeen plants that he talked to daily (their names were all literary characters)</li>
                        </ul>

                        <p>The breaking point came when he suggested we move in together. Not to an apartment – to a converted van he wanted to buy with my savings account. The van, he explained, would allow us to "live authentically" while he "found his artistic voice."</p>

                        <p>I said no. He said I was "too materialistic" and "afraid of real love." I said he was right, and thank you for the clarification.</p>

                        <p>The funny thing about dodging bullets is that you don't always realize how close they came until much later. Last month, I ran into Marcus at the grocery store. He was arguing with a cashier about whether quinoa should be pronounced "KEEN-wah" or "kee-NO-ah" like it was a matter of international importance.</p>

                        <p>He's still unemployed. Still living in that basement. Still unwashed.</p>

                        <p>But now he has a girlfriend who thinks his "anti-establishment lifestyle" is "inspiring." She was with him at the store, nodding along to his quinoa pronunciation lecture like he was delivering the Gettysburg Address.</p>

                        <p>And you know what? I'm happy for them. Really. Because somewhere out there is a woman who thinks that smelling like patchouli and existential dread is the height of romance, and Marcus deserves to find his person.</p>

                        <p>Meanwhile, I'm dating someone who showers daily, has a job, and lives in his own apartment. Revolutionary, I know.</p>

                        <p>The moral of this story? Sometimes the one that got away didn't get away – you just finally developed enough self-respect to let them go.</p>
                    </div>

                    <p><strong>And that, my dear readers, is why I never trust a man who pronounces quinoa with passion.</strong></p>

                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

                    <h3>💌 Thank You!</h3>
                    <p>Thank you for being part of this community! Your support means everything, and I love sharing these stories with people who understand that sometimes the best relationships are the ones that never happened.</p>

                    <p>Keep an eye on your inbox for more exclusive content, updates, and probably more stories about questionable life choices.</p>

                    <p>Much love and better dating decisions,</p>
                    <p><strong>Alexandra ❤️</strong></p>

                    <a href="https://alexandrarodica.com/shop.html" class="button">📚 Get the Full Book</a>
                </div>

                <div class="footer">
                    <p><strong>Alexandra Rodica</strong></p>
                    <p>Author of "The Worst Boyfriends Ever"</p>
                    <p style="margin-top: 20px; font-size: 12px;">
                        This exclusive content is just for our newsletter subscribers. 
                        <a href="#">Share this story</a> | <a href="#">Unsubscribe</a>
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
                    message: 'Bonus chapter sending simulation completed',
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
        console.log(`Found ${subscribers.length} subscribers for bonus chapter`);

        // Send bonus chapter to all subscribers in batches
        const batchSize = 10;
        for (let i = 0; i < subscribers.length; i += batchSize) {
            const batch = subscribers.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (subscriber) => {
                try {
                    if (subscriber.type === 'active') {
                        await resend.emails.send({
                            from: 'alexandra@alexandrarodica.com',
                            to: subscriber.email,
                            subject: '🎁 EXCLUSIVE: Bonus Chapter "The One That Got Away (Thank God)"',
                            html: bonusChapterHtml
                        });
                        sent++;
                    }
                } catch (error) {
                    console.error(`Failed to send bonus chapter to ${subscriber.email}:`, error);
                    failed++;
                }
            });

            await Promise.all(batchPromises);
            
            // Small delay between batches to avoid rate limiting
            if (i + batchSize < subscribers.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Bonus chapter sent successfully',
                stats: {
                    sent,
                    failed,
                    total: subscribers.length,
                    timestamp: new Date().toISOString()
                }
            })
        };

    } catch (error) {
        console.error('Error sending bonus chapter:', error);
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
