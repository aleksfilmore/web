// Netlify function to handle Stripe webhooks
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event, context) => {
    console.log('=== STRIPE WEBHOOK RECEIVED ===');
    console.log('Method:', event.httpMethod);
    console.log('Headers:', JSON.stringify(event.headers, null, 2));
    
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        console.log('❌ Method not allowed:', event.httpMethod);
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const sig = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
    let body = event.body;
    
    console.log('Raw event data:', {
        isBase64Encoded: event.isBase64Encoded,
        bodyType: typeof body,
        bodyLength: body?.length,
        hasSignature: !!sig,
        signaturePreview: sig?.substring(0, 50)
    });
    
    // Handle different body encodings in Netlify
    if (event.isBase64Encoded && body) {
        console.log('📦 Converting from base64...');
        body = Buffer.from(body, 'base64').toString('utf8');
        console.log('After base64 decode - length:', body.length);
    }
    
    // Additional body handling for different scenarios
    if (typeof body !== 'string') {
        if (body && typeof body === 'object') {
            body = JSON.stringify(body);
            console.log('Converted object body to string');
        } else {
            console.log('❌ Invalid body type:', typeof body);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid request body' })
            };
        }
    }
    
    console.log('Final body info:', {
        type: typeof body,
        length: body.length,
        firstChars: body.substring(0, 100),
        lastChars: body.substring(body.length - 50)
    });
    
    let stripeEvent;
    
    try {
        // Get and thoroughly clean webhook secret - remove all whitespace
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.replace(/\s/g, '');
        console.log('Webhook secret configured:', !!webhookSecret);
        console.log('Webhook secret length:', webhookSecret?.length);
        console.log('Webhook secret first 10 chars:', webhookSecret?.substring(0, 10));
        
        if (!webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET not configured');
        }
        
        // Log environment info for debugging
        console.log('Environment variables check:');
        console.log('- STRIPE_SECRET_KEY configured:', !!process.env.STRIPE_SECRET_KEY);
        console.log('- RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY);
        
        console.log('🔐 Verifying webhook signature...');
        console.log('Signature:', sig?.substring(0, 20) + '...');
        console.log('Signature length:', sig?.length);
        
        // Try signature verification
        console.log('Attempting signature verification...');
        
        try {
            // Primary attempt with current body
            stripeEvent = stripe.webhooks.constructEvent(body, sig, webhookSecret);
            console.log('✅ Webhook signature verified with current body');
        } catch (primaryErr) {
            console.log('❌ Primary verification failed:', primaryErr.message);
            
            // Try with raw event body if different
            if (event.body !== body) {
                try {
                    console.log('Trying with original event body...');
                    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, webhookSecret);
                    console.log('✅ Webhook signature verified with original body');
                } catch (secondaryErr) {
                    console.log('❌ Secondary verification failed:', secondaryErr.message);
                    throw primaryErr; // Throw the original error
                }
            } else {
                throw primaryErr;
            }
        }
        console.log('✅ Webhook signature verified');
        console.log('Event type:', stripeEvent.type);
        console.log('Event ID:', stripeEvent.id);
        
    } catch (err) {
        console.error('❌ Webhook verification failed:', err.message);
        console.error('Full error:', err);
        
        // Enhanced debugging for signature issues
        if (err.message.includes('No signatures found')) {
            console.log('🔍 DEBUGGING SIGNATURE ISSUE:');
            console.log('Raw signature header:', event.headers['stripe-signature']);
            console.log('All headers:', JSON.stringify(event.headers, null, 2));
            console.log('Body encoding info:', {
                isBase64Encoded: event.isBase64Encoded,
                originalBodyLength: event.body?.length,
                processedBodyLength: body?.length,
                bodyType: typeof body
            });
            
            // Try to manually parse signature
            try {
                const sigHeader = event.headers['stripe-signature'];
                if (sigHeader) {
                    const sigParts = sigHeader.split(',');
                    console.log('Signature parts:', sigParts);
                }
            } catch (parseErr) {
                console.log('Could not parse signature header:', parseErr.message);
            }
        }
        
        return {
            statusCode: 400,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                error: `Webhook Error: ${err.message}`,
                timestamp: new Date().toISOString()
            })
        };
    }
    
    // Process the webhook event
    try {
        console.log('📧 Processing webhook event...');
        
        switch (stripeEvent.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(stripeEvent.data.object);
                break;
            default:
                console.log(`ℹ️ Unhandled event type: ${stripeEvent.type}`);
        }
        
        console.log('✅ Webhook processed successfully');
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                received: true,
                event_type: stripeEvent.type,
                event_id: stripeEvent.id,
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error('❌ Error processing webhook:', error);
        
        // Still return 200 to prevent Stripe retries, but log the error
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                received: true,
                error: 'Processing failed - logged for manual review',
                event_type: stripeEvent.type,
                event_id: stripeEvent.id,
                timestamp: new Date().toISOString()
            })
        };
    }
};

async function handleCheckoutSessionCompleted(session) {
    console.log('💳 Processing completed checkout session:', session.id);
    
    const customerEmail = session.customer_details?.email || session.customer_email;
    console.log('👤 Customer email:', customerEmail);
    console.log('💰 Amount:', session.amount_total / 100, session.currency);
    console.log('✅ Payment status:', session.payment_status);
    
    if (!customerEmail) {
        throw new Error('No customer email found in session');
    }
    
    if (session.payment_status !== 'paid') {
        console.log('⚠️ Payment not completed, skipping email');
        return;
    }
    
    // Check if this includes audiobook access
    const hasAudiobook = await checkForAudiobookAccess(session);
    console.log('🎧 Has audiobook access:', hasAudiobook);
    
    if (!hasAudiobook) {
        console.log('📦 No audiobook in order, skipping audiobook email');
        return;
    }
    
    // Generate access token
    const accessToken = generateAccessToken(customerEmail, session.id);
    console.log('🔑 Generated access token');
    
    // Send audiobook access email
    await sendAudiobookAccessEmail(customerEmail, accessToken, session);
    
    console.log('✅ Checkout session processing completed');
}

function generateAccessToken(email, sessionId) {
    return Buffer.from(`${email}:${sessionId}:${Date.now()}`).toString('base64');
}

async function checkForAudiobookAccess(session) {
    try {
        // Get line items to check what was purchased
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            expand: ['data.price.product']
        });
        
        console.log('🛒 Line items:', lineItems.data.length);
        
        const hasAudiobook = lineItems.data.some(item => {
            const priceId = item.price?.id;
            const productName = item.price?.product?.name?.toLowerCase() || '';
            
            console.log(`📦 Item: ${productName} (${priceId})`);
            
            return (
                priceId === process.env.STRIPE_AUDIOBOOK_PRICE_ID ||
                priceId === process.env.STRIPE_BUNDLE_PRICE_ID ||
                productName.includes('audiobook') ||
                productName.includes('bundle')
            );
        });
        
        return hasAudiobook;
        
    } catch (error) {
        console.error('⚠️ Error checking line items:', error);
        // Default to true to ensure customers get access
        return true;
    }
}

async function sendAudiobookAccessEmail(customerEmail, accessToken, session) {
    const accessUrl = `${process.env.SITE_URL}/audiobook-player?token=${accessToken}`;
    
    const emailContent = `
        <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', sans-serif; background-color: #0E0F10; color: #F7F3ED; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="color: #FF3B3B; font-size: 28px; margin: 0;">🚩 Your Audiobook is Ready!</h1>
            </div>
            
            <div style="background: linear-gradient(135deg, rgba(247,243,237,0.05) 0%, rgba(247,243,237,0.1) 100%); border: 1px solid rgba(247,243,237,0.1); border-radius: 16px; padding: 30px; margin-bottom: 30px;">
                <h2 style="color: #F7F3ED; margin: 0 0 15px 0;">Your audiobook is ready to stream!</h2>
                <p style="color: rgba(247,243,237,0.8); margin: 0 0 25px 0;">
                    Thanks for supporting independent queer lit. Here's your personal streaming link:
                </p>
                
                <div style="text-align: center;">
                    <a href="${accessUrl}" style="
                        background-color: #FF3B3B;
                        color: #F7F3ED;
                        padding: 15px 30px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: 600;
                        display: inline-block;
                        margin: 10px 0;
                    ">🎧 Start Listening</a>
                </div>
                
                <p style="color: rgba(247,243,237,0.6); font-size: 14px; text-align: center;">
                    Bookmark this link for future access to your audiobook.
                </p>
            </div>
            
            <div style="border-top: 1px solid rgba(247,243,237,0.1); padding-top: 20px; font-size: 14px; color: rgba(247,243,237,0.6);">
                <p>• This link is unique to you and never expires</p>
                <p>• Stream on any device with an internet connection</p>
                <p>• Need help? Reply to this email</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: rgba(247,243,237,0.6); font-size: 12px;">
                <p>Happy listening! 🏳️‍🌈</p>
                <p style="margin: 0;">- Aleks</p>
            </div>
        </div>
    `;
    
    try {
        console.log('📬 Sending audiobook access email...');
        
        await resend.emails.send({
            from: 'aleks@aleksfilmore.com',
            to: customerEmail,
            subject: '🎧 Your Audiobook is Ready!',
            html: emailContent
        });
        
        console.log(`✅ Audiobook access email sent to ${customerEmail}`);
        
    } catch (error) {
        console.error('❌ Failed to send email:', error);
        throw new Error(`Email delivery failed: ${error.message}`);
    }
}