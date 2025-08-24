const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    // Verify webhook signature
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    console.log('✅ Webhook signature verified');
  } catch (err) {
    console.log(`❌ Webhook signature verification failed:`, err.message);
    return { 
      statusCode: 400, 
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
    };
  }

  // Handle different event types
  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripeEvent.data.object);
        break;
      case 'payment_intent.succeeded':
        console.log('💰 Payment succeeded:', stripeEvent.data.object.id);
        break;
      default:
        console.log(`🔄 Unhandled event type: ${stripeEvent.type}`);
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ received: true })
    };
  } catch (error) {
    console.error('❌ Error handling webhook:', error);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function handleCheckoutCompleted(session) {
  console.log('🛒 Checkout completed:', session.id);
  
  // Extract customer information
  const customerEmail = session.customer_details?.email || 
                       session.custom_fields?.find(field => field.key === 'email')?.text?.value;
  
  if (!customerEmail) {
    console.error('❌ No customer email found in session');
    return;
  }

  // Determine product type from line items
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
  const productName = lineItems.data[0]?.description || 'Product';
  const productPrice = session.amount_total / 100;
  
  // Detect product type based on price or description
  let productType = 'unknown';
  if (productPrice === 7.99 || productName.toLowerCase().includes('audiobook')) {
    productType = 'audiobook';
  } else if (productPrice === 19.99 || productName.toLowerCase().includes('signed')) {
    productType = 'signed-book';
  } else if (productPrice === 24.99 || productName.toLowerCase().includes('bundle')) {
    productType = 'bundle';
  }
  
  console.log('📦 Product detected:', productType, '-', productName);
  
  // Handle different product types
  if (productType === 'audiobook') {
    const accessToken = generateAudiobookToken();
    await sendAudiobookAccess(customerEmail, accessToken, session, productName);
    console.log('🎧 Audiobook access sent to:', customerEmail);
  } 
  else if (productType === 'signed-book') {
    await sendSignedBookConfirmation(customerEmail, session, productName);
    console.log('📚 Signed book order confirmation sent to:', customerEmail);
  }
  else if (productType === 'bundle') {
    const accessToken = generateAudiobookToken();
    await sendBundleConfirmation(customerEmail, accessToken, session, productName);
    console.log('🎁 Bundle confirmation sent to:', customerEmail);
  }
  
  // Log for admin dashboard
  console.log('📊 Order completed:', {
    sessionId: session.id,
    email: customerEmail,
    productType: productType,
    product: productName,
    amount: productPrice,
    currency: session.currency,
    shippingAddress: session.shipping_details?.address || null,
    timestamp: new Date().toISOString()
  });
}

function generateAudiobookToken() {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  return `ab_${timestamp}_${randomString}`;
}

async function sendAudiobookAccess(email, token, session, productName) {
  try {
    const accessUrl = `https://aleksfilmore.com/audiobook-player.html?token=${token}&email=${encodeURIComponent(email)}`;
    
    const { data, error } = await resend.emails.send({
      from: 'Aleks Filmore <aleksfilmore@gmail.com>', // Use your verified domain
      to: [email],
      subject: '🎧 Your Audiobook Access - The Worst Boyfriends Ever',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Audiobook Access</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #0E0F10; color: #F7F3ED;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 16px; overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #FF3B3B 0%, #e63946 100%); padding: 2rem; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 2rem; font-weight: 700;">🎧 Your Audiobook is Ready!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 3rem 2rem;">
              <p style="font-size: 1.2rem; margin: 0 0 2rem 0; line-height: 1.6;">
                Hey there, gorgeous human! 👋
              </p>
              
              <p style="font-size: 1.1rem; margin: 0 0 2rem 0; line-height: 1.6;">
                Thank you for purchasing <strong>"The Worst Boyfriends Ever"</strong> audiobook! You're about to hear some truly chaotic dating disasters narrated by yours truly.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 3rem 0;">
                <a href="${accessUrl}" 
                   style="background: linear-gradient(135deg, #FF3B3B 0%, #e63946 100%); color: white; padding: 1.5rem 3rem; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 1.2rem; display: inline-block; box-shadow: 0 8px 25px rgba(255, 59, 59, 0.4); transition: all 0.3s ease;">
                  🎧 Listen Now
                </a>
              </div>
              
              <!-- Important Info Box -->
              <div style="background: rgba(199, 255, 65, 0.1); border: 2px solid rgba(199, 255, 65, 0.3); border-radius: 12px; padding: 1.5rem; margin: 2rem 0;">
                <h3 style="margin: 0 0 1rem 0; color: #C7FF41; font-size: 1.2rem;">💾 Important - Save This Link!</h3>
                <p style="margin: 0; line-height: 1.6;">
                  Bookmark the link above! You can access your audiobook anytime, anywhere. No time limits, no restrictions.
                </p>
              </div>
              
              <!-- What's Included -->
              <div style="background: rgba(247, 243, 237, 0.05); border-radius: 12px; padding: 1.5rem; margin: 2rem 0;">
                <h3 style="margin: 0 0 1rem 0; color: #FF3B3B; font-size: 1.2rem;">🎁 What's Included:</h3>
                <ul style="margin: 0; padding-left: 1.5rem; line-height: 1.8;">
                  <li>Complete audiobook narrated by me</li>
                  <li><strong>Exclusive bonus epilogue</strong> (not available anywhere else)</li>
                  <li>High-quality streaming audio</li>
                  <li>Lifetime access - listen anytime</li>
                </ul>
              </div>
              
              <p style="font-size: 1.1rem; margin: 2rem 0 0 0; line-height: 1.6;">
                Now go forth and learn to spot those red flags from space! 🚩
              </p>
              
              <p style="margin: 2rem 0 0 0;">
                Stay chaotic (but safely),<br>
                <strong>Aleks</strong> 🏳️‍🌈
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #0E0F10; padding: 2rem; text-align: center; border-top: 1px solid rgba(247, 243, 237, 0.1);">
              <p style="margin: 0 0 1rem 0; font-size: 0.9rem; color: #C7CDD4;">
                Questions? Reply to this email or contact me directly.
              </p>
              <div style="margin-top: 1rem;">
                <a href="https://instagram.com/aleksfilmore" style="color: #C7FF41; text-decoration: none; margin: 0 10px;">📷 Instagram</a>
                <a href="https://tiktok.com/@aleksfilmore" style="color: #C7FF41; text-decoration: none; margin: 0 10px;">🎵 TikTok</a>
                <a href="https://aleksfilmore.com" style="color: #C7FF41; text-decoration: none; margin: 0 10px;">🌐 Website</a>
              </div>
            </div>
            
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      throw error;
    }

    console.log('✅ Email sent successfully:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Failed to send audiobook access email:', error);
    throw error;
  }
}

async function sendSignedBookConfirmation(email, session, productName) {
  try {
    const orderNumber = session.id.substring(8); // Use part of session ID as order number
    const shippingAddress = session.shipping_details?.address;
    
    const { data, error } = await resend.emails.send({
      from: 'Aleks Filmore <aleksfilmore@gmail.com>',
      to: [email],
      subject: '📚 Order Confirmed - Signed Copy of The Worst Boyfriends Ever',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #0E0F10; color: #F7F3ED;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 16px; overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #FF3B3B 0%, #e63946 100%); padding: 2rem; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 2rem; font-weight: 700;">📚 Order Confirmed!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 3rem 2rem;">
              <p style="font-size: 1.2rem; margin: 0 0 2rem 0; line-height: 1.6;">
                Hey gorgeous! 👋
              </p>
              
              <p style="font-size: 1.1rem; margin: 0 0 2rem 0; line-height: 1.6;">
                Your signed copy of <strong>"The Worst Boyfriends Ever"</strong> is confirmed and will be shipped soon!
              </p>
              
              <!-- Order Details -->
              <div style="background: rgba(199, 255, 65, 0.1); border: 2px solid rgba(199, 255, 65, 0.3); border-radius: 12px; padding: 1.5rem; margin: 2rem 0;">
                <h3 style="margin: 0 0 1rem 0; color: #C7FF41; font-size: 1.2rem;">📦 Order Details</h3>
                <p style="margin: 0.5rem 0; line-height: 1.6;"><strong>Order #:</strong> ${orderNumber}</p>
                <p style="margin: 0.5rem 0; line-height: 1.6;"><strong>Product:</strong> Signed Copy - The Worst Boyfriends Ever</p>
                <p style="margin: 0.5rem 0; line-height: 1.6;"><strong>Price:</strong> $${(session.amount_total / 100).toFixed(2)}</p>
                ${shippingAddress ? `
                <p style="margin: 1rem 0 0.5rem 0; line-height: 1.6;"><strong>Shipping to:</strong></p>
                <p style="margin: 0; line-height: 1.6; color: #C7CDD4;">
                  ${shippingAddress.line1}<br>
                  ${shippingAddress.line2 ? shippingAddress.line2 + '<br>' : ''}
                  ${shippingAddress.city}, ${shippingAddress.postal_code}<br>
                  ${shippingAddress.country}
                </p>
                ` : ''}
              </div>
              
              <!-- What to Expect -->
              <div style="background: rgba(247, 243, 237, 0.05); border-radius: 12px; padding: 1.5rem; margin: 2rem 0;">
                <h3 style="margin: 0 0 1rem 0; color: #FF3B3B; font-size: 1.2rem;">📬 What's Next:</h3>
                <ul style="margin: 0; padding-left: 1.5rem; line-height: 1.8;">
                  <li>Your book will be personally signed by me</li>
                  <li>Shipping within 3-5 business days</li>
                  <li>Tracking information will be sent via email</li>
                  <li>Expect delivery in 7-14 days (depending on location)</li>
                </ul>
              </div>
              
              <p style="font-size: 1.1rem; margin: 2rem 0 0 0; line-height: 1.6;">
                Thank you for supporting my chaotic literary journey! Can't wait for you to have this physical piece of disaster dating wisdom. 😄
              </p>
              
              <p style="margin: 2rem 0 0 0;">
                Stay amazing,<br>
                <strong>Aleks</strong> 🏳️‍🌈
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #0E0F10; padding: 2rem; text-align: center; border-top: 1px solid rgba(247, 243, 237, 0.1);">
              <p style="margin: 0 0 1rem 0; font-size: 0.9rem; color: #C7CDD4;">
                Questions about your order? Reply to this email!
              </p>
              <div style="margin-top: 1rem;">
                <a href="https://instagram.com/aleksfilmore" style="color: #C7FF41; text-decoration: none; margin: 0 10px;">📷 Instagram</a>
                <a href="https://tiktok.com/@aleksfilmore" style="color: #C7FF41; text-decoration: none; margin: 0 10px;">🎵 TikTok</a>
                <a href="https://aleksfilmore.com" style="color: #C7FF41; text-decoration: none; margin: 0 10px;">🌐 Website</a>
              </div>
            </div>
            
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('❌ Error sending signed book confirmation:', error);
      throw error;
    }

    console.log('✅ Signed book confirmation sent successfully:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Failed to send signed book confirmation:', error);
    throw error;
  }
}

async function sendBundleConfirmation(email, token, session, productName) {
  try {
    const orderNumber = session.id.substring(8);
    const shippingAddress = session.shipping_details?.address;
    const accessUrl = `https://aleksfilmore.com/audiobook-player.html?token=${token}&email=${encodeURIComponent(email)}`;
    
    const { data, error } = await resend.emails.send({
      from: 'Aleks Filmore <aleksfilmore@gmail.com>',
      to: [email],
      subject: '🎁 Bundle Order Complete - Audiobook + Signed Copy!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bundle Order Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #0E0F10; color: #F7F3ED;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 16px; overflow: hidden;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #FF3B3B 0%, #e63946 100%); padding: 2rem; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 2rem; font-weight: 700;">🎁 Bundle Complete!</h1>
            </div>
            
            <!-- Content -->
            <div style="padding: 3rem 2rem;">
              <p style="font-size: 1.2rem; margin: 0 0 2rem 0; line-height: 1.6;">
                You absolute legend! 🌟
              </p>
              
              <p style="font-size: 1.1rem; margin: 0 0 2rem 0; line-height: 1.6;">
                You've got the <strong>complete package</strong> - audiobook access AND a signed copy of "The Worst Boyfriends Ever"!
              </p>
              
              <!-- Audiobook Access -->
              <div style="background: linear-gradient(135deg, rgba(199, 255, 65, 0.15) 0%, rgba(199, 255, 65, 0.05) 100%); border: 2px solid rgba(199, 255, 65, 0.3); border-radius: 12px; padding: 1.5rem; margin: 2rem 0; text-align: center;">
                <h3 style="margin: 0 0 1rem 0; color: #C7FF41; font-size: 1.3rem;">🎧 Instant Audiobook Access</h3>
                <a href="${accessUrl}" 
                   style="background: linear-gradient(135deg, #FF3B3B 0%, #e63946 100%); color: white; padding: 1.2rem 2.5rem; text-decoration: none; border-radius: 50px; font-weight: 600; font-size: 1.1rem; display: inline-block; margin: 1rem 0;">
                  Listen Now
                </a>
                <p style="margin: 1rem 0 0 0; font-size: 0.9rem; color: #C7CDD4;">Available immediately - bookmark this link!</p>
              </div>
              
              <!-- Order Details -->
              <div style="background: rgba(247, 243, 237, 0.05); border-radius: 12px; padding: 1.5rem; margin: 2rem 0;">
                <h3 style="margin: 0 0 1rem 0; color: #FF3B3B; font-size: 1.2rem;">📦 Your Complete Order</h3>
                <p style="margin: 0.5rem 0; line-height: 1.6;"><strong>Order #:</strong> ${orderNumber}</p>
                <p style="margin: 0.5rem 0; line-height: 1.6;"><strong>Bundle Includes:</strong></p>
                <ul style="margin: 0.5rem 0; padding-left: 1.5rem; line-height: 1.6;">
                  <li>🎧 Complete audiobook with bonus epilogue</li>
                  <li>📚 Personally signed physical copy</li>
                  <li>💰 $5 savings vs buying separately!</li>
                </ul>
                <p style="margin: 0.5rem 0; line-height: 1.6;"><strong>Total:</strong> $${(session.amount_total / 100).toFixed(2)}</p>
                ${shippingAddress ? `
                <p style="margin: 1rem 0 0.5rem 0; line-height: 1.6;"><strong>Shipping to:</strong></p>
                <p style="margin: 0; line-height: 1.6; color: #C7CDD4;">
                  ${shippingAddress.line1}<br>
                  ${shippingAddress.line2 ? shippingAddress.line2 + '<br>' : ''}
                  ${shippingAddress.city}, ${shippingAddress.postal_code}<br>
                  ${shippingAddress.country}
                </p>
                ` : ''}
              </div>
              
              <p style="font-size: 1.1rem; margin: 2rem 0 0 0; line-height: 1.6;">
                You've got the best of both worlds - immediate audiobook entertainment and a physical keepsake that's personally signed! 
              </p>
              
              <p style="margin: 2rem 0 0 0;">
                Thank you for being absolutely amazing! 💫<br>
                <strong>Aleks</strong> 🏳️‍🌈
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #0E0F10; padding: 2rem; text-align: center; border-top: 1px solid rgba(247, 243, 237, 0.1);">
              <p style="margin: 0 0 1rem 0; font-size: 0.9rem; color: #C7CDD4;">
                Questions? Reply to this email or contact me directly!
              </p>
              <div style="margin-top: 1rem;">
                <a href="https://instagram.com/aleksfilmore" style="color: #C7FF41; text-decoration: none; margin: 0 10px;">📷 Instagram</a>
                <a href="https://tiktok.com/@aleksfilmore" style="color: #C7FF41; text-decoration: none; margin: 0 10px;">🎵 TikTok</a>
                <a href="https://aleksfilmore.com" style="color: #C7FF41; text-decoration: none; margin: 0 10px;">🌐 Website</a>
              </div>
            </div>
            
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('❌ Error sending bundle confirmation:', error);
      throw error;
    }

    console.log('✅ Bundle confirmation sent successfully:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Failed to send bundle confirmation:', error);
    throw error;
  }
}
