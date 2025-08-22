// Netlify function to handle Stripe webhooks
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    console.log('=== NETLIFY WEBHOOK RECEIVED ===');
    
    const sig = event.headers['stripe-signature'];
    const body = event.body;
    
    let stripeEvent;
    
    try {
        console.log('Verifying webhook signature...');
        console.log('Body type:', typeof body);
        console.log('Body length:', body ? body.length : 'undefined');
        console.log('Signature header:', sig ? 'present' : 'missing');
        
        // Trim the webhook secret to remove any whitespace
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
        console.log('Webhook secret configured:', webhookSecret ? 'yes' : 'no');
        
        if (!webhookSecret) {
            throw new Error('Webhook secret not configured');
        }
        
        stripeEvent = stripe.webhooks.constructEvent(body, sig, webhookSecret);
        console.log('✅ Webhook signature verified successfully');
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
        };
    }
    
    console.log(`📧 Received webhook event: ${stripeEvent.type} (ID: ${stripeEvent.id})`);
    
    // Handle the event
    try {
        switch (stripeEvent.type) {
            case 'checkout.session.completed':
                const session = stripeEvent.data.object;
                console.log('💳 Payment completed:', session.id);
                console.log('👤 Customer:', session.customer_email || session.customer_details?.email);
                console.log('💰 Amount:', session.amount_total / 100, session.currency?.toUpperCase());
                
                try {
                    await processCompletedCheckout(session);
                    console.log(`✅ Successfully processed order ${session.id}`);
                } catch (error) {
                    console.error('❌ Error processing completed checkout:', error);
                    // Don't return error to Stripe - we'll handle this manually
                    console.log('📝 Order data logged for manual processing');
                }
                break;
            default:
                console.log(`ℹ️ Unhandled event type ${stripeEvent.type}`);
        }
        
        // Always return 200 to Stripe to acknowledge receipt
        console.log('✅ Webhook processed successfully, sending 200 response');
        return {
            statusCode: 200,
            body: JSON.stringify({
                received: true, 
                event_type: stripeEvent.type, 
                event_id: stripeEvent.id
            })
        };
        
    } catch (error) {
        console.error('❌ Critical error in webhook handler:', error);
        // Still return 200 to avoid webhook retries, but log for manual handling
        return {
            statusCode: 200,
            body: JSON.stringify({
                received: true, 
                error: 'Logged for manual processing'
            })
        };
    }
};

async function processCompletedCheckout(session) {
    // Generate access token for digital products
    console.log('🔐 Generating access token...');
    const accessToken = generateAccessToken(
        session.customer_email || session.customer_details?.email, 
        session.id
    );
    
    // Send confirmation email
    console.log('📬 Sending confirmation email...');
    await sendConfirmationEmail(session, accessToken);
    
    console.log('✅ Checkout processing completed');
}

function generateAccessToken(email, sessionId) {
    // Simple token generation - same as server.js
    const token = Buffer.from(`${email}:${sessionId}:${Date.now()}`).toString('base64');
    return token;
}

async function sendConfirmationEmail(session, accessToken) {
    const customerEmail = session.customer_email || session.customer_details?.email;
    
    if (!customerEmail) {
        console.error('No customer email found');
        return;
    }
    
    // Check if this purchase includes audiobook access
    const hasAudiobook = await checkForAudiobookAccess(session);
    
    if (!hasAudiobook) {
        console.log('No audiobook in this order, skipping audiobook email');
        return;
    }
    
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
            </div>
            
            <div style="border-top: 1px solid rgba(247,243,237,0.1); padding-top: 20px; font-size: 14px; color: rgba(247,243,237,0.6);">
                <p>• This link is unique to you and expires in 1 year</p>
                <p>• Stream on any device with an internet connection</p>
                <p>• Need help? Reply to this email</p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: rgba(247,243,237,0.6); font-size: 12px;">
                <p>Happy listening! 🏳️‍🌈</p>
            </div>
        </div>
    `;
    
    try {
        await resend.emails.send({
            from: 'aleks@aleksfilmore.com',
            to: customerEmail,
            subject: '🎧 Your Audiobook is Ready!',
            html: emailContent
        });
        
        console.log(`✅ Confirmation email sent to ${customerEmail}`);
    } catch (error) {
        console.error('❌ Error sending confirmation email:', error);
        throw error;
    }
}

async function checkForAudiobookAccess(session) {
    try {
        // Get line items to check what was purchased
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        
        const hasAudiobook = lineItems.data.some(item => 
            item.price?.id === process.env.STRIPE_AUDIOBOOK_PRICE_ID || // Audiobook price ID
            item.price?.id === process.env.STRIPE_BUNDLE_PRICE_ID || // Bundle includes audiobook
            item.description?.toLowerCase().includes('audiobook')
        );
        
        console.log('Audiobook check result:', hasAudiobook);
        return hasAudiobook;
        
    } catch (error) {
        console.error('Error checking for audiobook access:', error);
        // Default to true to be safe
        return true;
    }
}
