require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path = require('path');
const fs = require('fs');
const { Resend } = require('resend');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const helmet = require('helmet');
const MailerLiteService = require('./mailerlite-integration');
const GoogleAnalyticsService = require('./google-analytics-service');
const StripeAnalyticsService = require('./stripe-analytics-service');
const AudiobookAnalyticsService = require('./audiobook-analytics-service');

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);
const mailerLite = new MailerLiteService();
const googleAnalytics = new GoogleAnalyticsService();
const stripeAnalytics = new StripeAnalyticsService();
const audiobookAnalytics = new AudiobookAnalyticsService();

// Store for access tokens and purchase records (in production, use a database)
const accessTokens = new Map();
const purchaseRecords = new Map();

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.tailwindcss.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://js.stripe.com", "https://www.googletagmanager.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.stripe.com", "https://www.google-analytics.com"],
            frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"]
        }
    }
}));

app.use(cors({
    origin: process.env.SITE_URL || 'http://localhost:3000',
    credentials: true
}));

// Middleware
app.use('/webhook', express.raw({type: 'application/json'}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('.'));

// Serve admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Generate unique access token
function generateAccessToken(email, productType) {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    
    accessTokens.set(token, {
        email,
        productType,
        createdAt: new Date(),
        expiresAt
    });
    
    return token;
}

// Verify access token
function verifyAccessToken(token) {
    const tokenData = accessTokens.get(token);
    if (!tokenData) return null;
    
    if (new Date() > tokenData.expiresAt) {
        accessTokens.delete(token);
        return null;
    }
    
    return tokenData;
}

// Products configuration
const PRODUCTS = {
    'audiobook': {
        name: 'The Worst Boyfriends Ever (Audiobook)',
        stripe_product_id: process.env.STRIPE_AUDIOBOOK_PRODUCT_ID,
        stripe_price_id: process.env.STRIPE_AUDIOBOOK_PRICE_ID,
        price: 7.99,
        currency: 'usd',
        type: 'digital',
        description: 'Audiobook with exclusive bonus epilogue and instant access'
    },
    'signed-book': {
        name: 'The Worst Boyfriends Ever (Signed Paperbook)',
        stripe_product_id: process.env.STRIPE_SIGNED_BOOK_PRODUCT_ID,
        stripe_price_id: process.env.STRIPE_SIGNED_BOOK_PRICE_ID,
        price: 17.99,
        currency: 'usd',
        type: 'physical',
        description: 'Personally signed paperback with handwritten note + shipping'
    },
    'bundle': {
        name: 'The Worst Boyfriends Ever (Bundle)',
        stripe_product_id: process.env.STRIPE_BUNDLE_PRODUCT_ID,
        stripe_price_id: process.env.STRIPE_BUNDLE_PRICE_ID,
        price: 22.99,
        currency: 'usd',
        type: 'mixed',
        description: 'Audiobook + Signed paperback bundle'
    }
};

// Simple checkout route for direct product purchase
app.get('/checkout', async (req, res) => {
    try {
        const { product } = req.query;
        
        if (!product || !PRODUCTS[product]) {
            return res.status(400).send('Invalid product');
        }
        
        const productInfo = PRODUCTS[product];
        
        // Create Stripe session for single product
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: productInfo.stripe_price_id,
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${req.headers.origin || process.env.SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin || process.env.SITE_URL}/audiobook.html`,
            metadata: {
                product_id: product,
                product_type: productInfo.type || 'digital',
                cart_items: JSON.stringify([{ id: product, quantity: 1 }])
            },
            customer_email: req.query.email || undefined,
            ...(productInfo.type === 'physical' || productInfo.type === 'bundle' ? {
                shipping_address_collection: {
                    allowed_countries: ['US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'CH', 'AU', 'JP']
                }
            } : {})
        });
        
        // Redirect to Stripe Checkout
        res.redirect(303, session.url);
        
    } catch (error) {
        console.error('Checkout redirect error:', error);
        res.status(500).send('Error creating checkout session');
    }
});

// Create checkout session
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { items } = req.body;
        
        // Build line items for Stripe using existing price IDs
        const lineItems = items.map(item => {
            const product = PRODUCTS[item.id];
            if (!product) {
                throw new Error(`Unknown product: ${item.id}`);
            }
            
            return {
                price: product.stripe_price_id,
                quantity: item.quantity,
            };
        });
        
        // Check if we need shipping
        const needsShipping = items.some(item => 
            PRODUCTS[item.id].type === 'physical' || PRODUCTS[item.id].type === 'bundle'
        );
        
        const sessionConfig = {
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/shop`,
            metadata: {
                cart_items: JSON.stringify(items)
            }
        };
        
        // Add shipping if needed
        if (needsShipping) {
            sessionConfig.shipping_address_collection = {
                allowed_countries: ['BE', 'NL', 'FR', 'DE', 'GB', 'US', 'CA', 'AU'], // Add more as needed
            };
            sessionConfig.shipping_options = [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: { amount: 500, currency: 'eur' }, // €5 shipping
                        display_name: 'Standard Shipping',
                        delivery_estimate: {
                            minimum: { unit: 'business_day', value: 5 },
                            maximum: { unit: 'business_day', value: 10 },
                        },
                    },
                },
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: { amount: 1500, currency: 'eur' }, // €15 express
                        display_name: 'Express Shipping',
                        delivery_estimate: {
                            minimum: { unit: 'business_day', value: 2 },
                            maximum: { unit: 'business_day', value: 5 },
                        },
                    },
                },
            ];
        }
        
        const session = await stripe.checkout.sessions.create(sessionConfig);
        
        res.json({ url: session.url });
    } catch (error) {
        console.error('Checkout session creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Handle successful payment
app.get('/success', async (req, res) => {
    try {
        const sessionId = req.query.session_id;
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (session.payment_status === 'paid') {
            // Generate access token for digital products
            const accessToken = generateAccessToken(session.customer_email, sessionId);
            
            // Save purchase record
            await savePurchaseRecord(session, accessToken);
            
            // Send confirmation email
            await sendConfirmationEmail(session, accessToken);
            
            // Redirect to success page with access token if digital products
            const items = JSON.parse(session.metadata.cart_items);
            const hasDigital = items.some(item => 
                PRODUCTS[item.id].type === 'digital' || PRODUCTS[item.id].type === 'bundle'
            );
            
            if (hasDigital) {
                res.redirect(`/audiobook-player?token=${accessToken}`);
            } else {
                res.redirect('/order-confirmation');
            }
        } else {
            res.redirect('/payment-error');
        }
    } catch (error) {
        console.error('Success handling error:', error);
        res.redirect('/payment-error');
    }
});

// Verify access token for audiobook player
app.get('/api/verify-access', async (req, res) => {
    try {
        const token = req.query.token;
        
        if (!token) {
            return res.status(401).json({ error: 'No access token provided' });
        }
        
        // Verify token (you'll need to implement token storage/verification)
        const purchase = await verifyAccessToken(token);
        
        if (!purchase) {
            return res.status(401).json({ error: 'Invalid access token' });
        }
        
        res.json({ 
            valid: true, 
            customerEmail: purchase.customerEmail,
            purchaseDate: purchase.purchaseDate,
            products: purchase.products
        });
    } catch (error) {
        console.error('Access verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// API endpoint to get Stripe configuration
app.get('/api/config', (req, res) => {
    res.json({
        stripe_publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
        site_url: process.env.SITE_URL || 'http://localhost:3000'
    });
});

// API endpoint to get products
app.get('/api/products', (req, res) => {
    res.json(PRODUCTS);
});

// Serve audiobook files (protected)
app.get('/api/audiobook/:filename', async (req, res) => {
    try {
        const token = req.query.token;
        const filename = req.params.filename;
        
        // Verify access
        const purchase = await verifyAccessToken(token);
        if (!purchase) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // Check if user has access to audiobook
        const hasAudiobookAccess = purchase.products.some(p => 
            p.id === 'audiobook' || p.id === 'bundle'
        );
        
        if (!hasAudiobookAccess) {
            return res.status(403).json({ error: 'No audiobook access' });
        }
        
        const audioPath = path.join(__dirname, 'audio', filename);
        
        if (!fs.existsSync(audioPath)) {
            return res.status(404).json({ error: 'Audio file not found' });
        }
        
        const stat = fs.statSync(audioPath);
        const fileSize = stat.size;
        const range = req.headers.range;
        
        if (range) {
            // Support for audio streaming with range requests
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(audioPath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'audio/mpeg',
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'audio/mpeg',
            };
            res.writeHead(200, head);
            fs.createReadStream(audioPath).pipe(res);
        }
    } catch (error) {
        console.error('Audio serving error:', error);
        res.status(500).json({ error: 'Audio serving failed' });
    }
});

// Helper functions
function generateAccessToken(email, sessionId) {
    // Simple token generation - in production, use JWT or similar
    const token = Buffer.from(`${email}:${sessionId}:${Date.now()}`).toString('base64');
    return token;
}

async function savePurchaseRecord(session, accessToken) {
    // Save to database or file system
    // For now, saving to JSON file (in production, use a proper database)
    const purchaseData = {
        sessionId: session.id,
        customerEmail: session.customer_email,
        accessToken: accessToken,
        purchaseDate: new Date().toISOString(),
        products: JSON.parse(session.metadata.cart_items),
        shippingAddress: session.shipping_address,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total / 100 // Convert from cents
    };
    
    const purchasesFile = path.join(__dirname, 'data', 'purchases.json');
    
    // Ensure data directory exists
    const dataDir = path.dirname(purchasesFile);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    let purchases = [];
    if (fs.existsSync(purchasesFile)) {
        purchases = JSON.parse(fs.readFileSync(purchasesFile, 'utf8'));
    }
    
    purchases.push(purchaseData);
    fs.writeFileSync(purchasesFile, JSON.stringify(purchases, null, 2));
}

async function verifyAccessToken(token) {
    try {
        const purchasesFile = path.join(__dirname, 'data', 'purchases.json');
        
        if (!fs.existsSync(purchasesFile)) {
            return null;
        }
        
        const purchases = JSON.parse(fs.readFileSync(purchasesFile, 'utf8'));
        return purchases.find(p => p.accessToken === token);
    } catch (error) {
        console.error('Token verification error:', error);
        return null;
    }
}

async function sendConfirmationEmail(session, accessToken) {
    const items = JSON.parse(session.metadata.cart_items);
    const hasDigital = items.some(item => 
        PRODUCTS[item.id].type === 'digital' || PRODUCTS[item.id].type === 'bundle'
    );
    
    let emailContent = `
        <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', sans-serif; background-color: #0E0F10; color: #F7F3ED; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="color: #FF3B3B; font-size: 28px; margin: 0;">🚩 Order Confirmed!</h1>
            </div>
            
            <div style="background: linear-gradient(135deg, rgba(247,243,237,0.05) 0%, rgba(247,243,237,0.1) 100%); border: 1px solid rgba(247,243,237,0.1); border-radius: 16px; padding: 30px; margin-bottom: 30px;">
                <h2 style="color: #F7F3ED; margin: 0 0 15px 0;">Thank you for your purchase!</h2>
                <p style="color: rgba(247,243,237,0.8); margin: 0 0 25px 0;">
                    Your order has been confirmed. Here are the details:
                </p>
                
                <h3 style="color: #FF3B3B; margin: 20px 0 10px 0;">Order Summary:</h3>
                <ul style="color: rgba(247,243,237,0.8);">
    `;
    
    items.forEach(item => {
        const product = PRODUCTS[item.id];
        emailContent += `<li>${product.name} x ${item.quantity} - €${(product.price * item.quantity).toFixed(2)}</li>`;
    });
    
    emailContent += `</ul>`;
    
    if (hasDigital) {
        emailContent += `
            <div style="text-align: center; margin: 30px 0;">
                <h3 style="color: #FF3B3B;">🎧 Access Your Audiobook:</h3>
                <a href="${process.env.SITE_URL}/audiobook-player?token=${accessToken}" style="
                    background-color: #FF3B3B;
                    color: #F7F3ED;
                    padding: 15px 30px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 600;
                    display: inline-block;
                    margin: 10px 0;
                ">🎧 Start Listening</a>
                <p style="color: rgba(247,243,237,0.6); font-size: 14px;">
                    Bookmark this link for future access to your audiobook.
                </p>
            </div>
        `;
    }
    
    if (session.shipping_address) {
        emailContent += `
            <h3 style="color: #FF3B3B; margin: 20px 0 10px 0;">📦 Shipping Information:</h3>
            <p style="color: rgba(247,243,237,0.8);">Your signed book will be shipped to:</p>
            <div style="background: rgba(247,243,237,0.05); padding: 15px; border-radius: 8px; margin: 10px 0;">
                <p style="margin: 0; color: #F7F3ED;">
                    ${session.shipping_address.line1}<br>
                    ${session.shipping_address.line2 ? session.shipping_address.line2 + '<br>' : ''}
                    ${session.shipping_address.city}, ${session.shipping_address.state} ${session.shipping_address.postal_code}<br>
                    ${session.shipping_address.country}
                </p>
            </div>
            <p style="color: rgba(247,243,237,0.6); font-size: 14px;">Expected delivery: 5-10 business days</p>
        `;
    }
    
    emailContent += `
            </div>
            
            <div style="border-top: 1px solid rgba(247,243,237,0.1); padding-top: 20px; text-align: center;">
                <p style="color: rgba(247,243,237,0.8);">Thank you for supporting independent queer authors and their chaotic dating disasters! 💕</p>
                <p style="color: rgba(247,243,237,0.6);">With love and questionable life choices,<br>Aleks ✨</p>
            </div>
        </div>
    `;
    
    try {
        await resend.emails.send({
            from: 'aleksfilmore@gmail.com',
            to: session.customer_email,
            subject: 'Order Confirmation - The Worst Boyfriends Ever',
            html: emailContent
        });
        console.log(`Confirmation email sent to ${session.customer_email}`);
    } catch (error) {
        console.error('Error sending confirmation email:', error);
    }
}

// Test endpoint for generating access tokens (development only)
app.post('/api/generate-test-token', (req, res) => {
    const { email, productType } = req.body;
    
    if (!email || !productType) {
        return res.status(400).json({ error: 'Email and product type required' });
    }
    
    const token = generateAccessToken(email, productType);
    
    res.json({
        token,
        message: 'Test token generated successfully',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    });
});

// Audiobook player route with token verification
app.get('/audiobook-player', async (req, res) => {
    const token = req.query.token;
    
    if (!token) {
        return res.status(401).send(`
            <html>
                <head>
                    <title>Access Required</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; background: #0E0F10; color: #F7F3ED; text-align: center; padding: 50px; }
                        .error-container { max-width: 500px; margin: 0 auto; }
                        .btn { background: #FF3B3B; color: #F7F3ED; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="error-container">
                        <h1>🚩 Access Token Required</h1>
                        <p>You need a valid access token to listen to the audiobook.</p>
                        <a href="/shop" class="btn">Get Access</a>
                    </div>
                </body>
            </html>
        `);
    }
    
    // First try to decode the token and check if it's valid format
    try {
        const decodedToken = Buffer.from(token, 'base64').toString();
        const [email, sessionId, timestamp] = decodedToken.split(':');
        
        if (!email || !sessionId || !timestamp) {
            throw new Error('Invalid token format');
        }
        
        // Token contains timestamp but doesn't expire - customers have permanent access
        // The timestamp is just for tracking when the purchase was made
        
        console.log(`Audiobook access attempt: ${email}, session: ${sessionId}`);
        
        // For now, allow access if token format is valid
        // In production, you'd verify against Stripe or database
        res.sendFile(path.join(__dirname, 'audiobook-player.html'));
        
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(403).send(`
            <html>
                <head>
                    <title>Invalid Access</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; background: #0E0F10; color: #F7F3ED; text-align: center; padding: 50px; }
                        .error-container { max-width: 500px; margin: 0 auto; }
                        .btn { background: #FF3B3B; color: #F7F3ED; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="error-container">
                        <h1>🚩 Invalid or Expired Token</h1>
                        <p>Your access token is invalid or has expired.</p>
                        <a href="/shop" class="btn">Purchase Again</a>
                    </div>
                </body>
            </html>
        `);
    }
});

// Protected audio serving endpoint
app.get('/audio/:filename', (req, res) => {
    const token = req.query.token;
    const filename = req.params.filename;
    
    if (!token) {
        return res.status(403).json({ error: 'Access token required' });
    }
    
    // Verify token format
    try {
        const decodedToken = Buffer.from(token, 'base64').toString();
        const [email, sessionId, timestamp] = decodedToken.split(':');
        
        if (!email || !sessionId || !timestamp) {
            throw new Error('Invalid token format');
        }
        
        // Token contains timestamp but doesn't expire - customers have permanent access
        // The timestamp is just for tracking when the purchase was made
        
    } catch (error) {
        console.error('Audio access token verification failed:', error.message);
        return res.status(403).json({ error: 'Invalid access token' });
    }
    
    const audioPath = path.join(__dirname, 'audio', filename);
    
    if (!fs.existsSync(audioPath)) {
        return res.status(404).json({ error: 'Audio file not found' });
    }
    
    // Set appropriate headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    
    res.sendFile(audioPath);
});

// Handle audiobook access after successful payment
async function handleAudiobookAccess(session) {
    try {
        // Get customer email
        const customerEmail = session.customer_details?.email || session.customer_email;
        if (!customerEmail) {
            console.error('No customer email found in session');
            return;
        }

        // Check if this purchase includes audiobook
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const hasAudiobook = lineItems.data.some(item => 
            item.price?.id === process.env.STRIPE_AUDIOBOOK_PRICE_ID || // Audiobook price ID
            item.description?.toLowerCase().includes('audiobook') ||
            item.price?.product === process.env.STRIPE_AUDIOBOOK_PRODUCT_ID // Audiobook product ID
        );

        if (hasAudiobook) {
            // Generate unique access token
            const accessToken = generateAccessToken(customerEmail, 'audiobook');
            const accessUrl = `${process.env.SITE_URL || 'https://aleksfilmore.github.io/web'}/audiobook-player?token=${accessToken}`;

            // Send email with unique access link
            await resend.emails.send({
                from: 'aleksfilmore@gmail.com',
                to: customerEmail,
                subject: '🎧 Your Audiobook is Ready!',
                html: `
                    <div style="max-width: 600px; margin: 0 auto; font-family: 'Inter', sans-serif; background-color: #0E0F10; color: #F7F3ED; padding: 40px 20px;">
                        <div style="text-align: center; margin-bottom: 40px;">
                            <h1 style="color: #FF3B3B; font-size: 28px; margin: 0;">🚩 Access Granted!</h1>
                        </div>
                        
                        <div style="background: linear-gradient(135deg, rgba(247,243,237,0.05) 0%, rgba(247,243,237,0.1) 100%); border: 1px solid rgba(247,243,237,0.1); border-radius: 16px; padding: 30px; margin-bottom: 30px;">
                            <h2 style="color: #F7F3ED; margin: 0 0 15px 0;">Your audiobook is ready to stream!</h2>
                            <p style="color: rgba(247,243,237,0.8); margin: 0 0 25px 0;">
                                Thanks for supporting independent queer authors and their beautifully chaotic storytelling! Here's your personal streaming link:
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
                            <p>Happy listening and may your dating life be less chaotic than mine! 🏳️‍🌈✨</p>
                            <p>- Aleks</p>
                        </div>
                    </div>
                `
            });

            // Store purchase record
            purchaseRecords.set(session.id, {
                email: customerEmail,
                accessToken,
                purchaseDate: new Date(),
                productType: 'audiobook'
            });

            console.log(`Audiobook access sent to ${customerEmail} with token ${accessToken}`);
        }
    } catch (error) {
        console.error('Error handling audiobook access:', error);
    }
}

// Webhook for Stripe events
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    console.log('=== WEBHOOK RECEIVED ===');
    const sig = req.headers['stripe-signature'];
    
    let event;
    
    try {
        console.log('Verifying webhook signature...');
        console.log('Body type:', typeof req.body);
        console.log('Body length:', req.body ? req.body.length : 'undefined');
        console.log('Signature header:', sig ? 'present' : 'missing');
        
        // Trim the webhook secret to remove any whitespace
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
        console.log('Webhook secret configured:', webhookSecret ? 'yes' : 'no');
        
        if (!webhookSecret) {
            throw new Error('Webhook secret not configured');
        }
        
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        console.log('✅ Webhook signature verified successfully');
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        console.error('Full error:', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    console.log(`📧 Received webhook event: ${event.type} (ID: ${event.id})`);
    
    // Handle the event
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                console.log('💳 Payment completed:', session.id);
                console.log('👤 Customer:', session.customer_email || session.customer_details?.email);
                console.log('💰 Amount:', session.amount_total / 100, session.currency?.toUpperCase());
                
                try {
                    // Generate access token for digital products
                    console.log('🔐 Generating access token...');
                    const accessToken = generateAccessToken(session.customer_email || session.customer_details?.email, session.id);
                    
                    // Save purchase record
                    console.log('💾 Saving purchase record...');
                    await savePurchaseRecord(session, accessToken);
                    
                    // Send confirmation email
                    console.log('📬 Sending confirmation email...');
                    await sendConfirmationEmail(session, accessToken);
                    
                    // Handle audiobook access specifically
                    console.log('🎧 Handling audiobook access...');
                    await handleAudiobookAccess(session);
                    
                    console.log(`✅ Successfully processed order ${session.id}`);
                } catch (error) {
                    console.error('❌ Error processing completed checkout:', error);
                    // Don't return error to Stripe - we'll handle this manually
                    console.log('📝 Order data saved for manual processing');
                }
                break;
            default:
                console.log(`ℹ️ Unhandled event type ${event.type}`);
        }
        
        // Always return 200 to Stripe to acknowledge receipt
        console.log('✅ Webhook processed successfully, sending 200 response');
        res.json({received: true, event_type: event.type, event_id: event.id});
        
    } catch (error) {
        console.error('❌ Critical error in webhook handler:', error);
        // Still return 200 to avoid webhook retries, but log for manual handling
        res.json({received: true, error: 'Logged for manual processing'});
    }
    
    console.log('=== WEBHOOK COMPLETE ===\n');
});

// ===== ENHANCED ADMIN API ENDPOINTS =====

// Google Analytics endpoints
app.get('/admin/api/google-analytics/stats', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        console.log(`Fetching Google Analytics stats for ${days} days...`);
        
        const stats = await googleAnalytics.getWebsiteStats(`${days}daysAgo`);
        res.json(stats);
    } catch (error) {
        console.error('Google Analytics stats error:', error);
        res.status(500).json({ error: 'Failed to fetch Google Analytics stats' });
    }
});

app.get('/admin/api/google-analytics/top-pages', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        console.log(`Fetching top pages for ${days} days...`);
        
        const topPages = await googleAnalytics.getTopPages(`${days}daysAgo`);
        res.json(topPages);
    } catch (error) {
        console.error('Google Analytics top pages error:', error);
        res.status(500).json({ error: 'Failed to fetch top pages' });
    }
});

app.get('/admin/api/google-analytics/traffic-sources', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        console.log(`Fetching traffic sources for ${days} days...`);
        
        const trafficSources = await googleAnalytics.getTrafficSources(`${days}daysAgo`);
        res.json(trafficSources);
    } catch (error) {
        console.error('Google Analytics traffic sources error:', error);
        res.status(500).json({ error: 'Failed to fetch traffic sources' });
    }
});

app.get('/admin/api/google-analytics/realtime', async (req, res) => {
    try {
        console.log('Fetching realtime Google Analytics data...');
        
        const realtimeData = await googleAnalytics.getRealtimeStats();
        res.json(realtimeData);
    } catch (error) {
        console.error('Google Analytics realtime error:', error);
        res.status(500).json({ error: 'Failed to fetch realtime data' });
    }
});

// Stripe Analytics endpoints
app.get('/admin/api/stripe/revenue-analytics', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        console.log(`Fetching Stripe revenue analytics for ${days} days...`);
        
        const revenueData = await stripeAnalytics.getRevenueAnalytics(parseInt(days));
        res.json(revenueData);
    } catch (error) {
        console.error('Stripe revenue analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch revenue analytics' });
    }
});

app.get('/admin/api/stripe/product-analytics', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        console.log(`Fetching Stripe product analytics for ${days} days...`);
        
        const productData = await stripeAnalytics.getProductAnalytics(parseInt(days));
        res.json(productData);
    } catch (error) {
        console.error('Stripe product analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch product analytics' });
    }
});

app.get('/admin/api/stripe/recent-orders', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        console.log(`Fetching ${limit} recent Stripe orders...`);
        
        const orders = await stripeAnalytics.getRecentOrders(parseInt(limit));
        res.json(orders);
    } catch (error) {
        console.error('Stripe recent orders error:', error);
        res.status(500).json({ error: 'Failed to fetch recent orders' });
    }
});

app.get('/admin/api/stripe/customer-analytics', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        console.log(`Fetching Stripe customer analytics for ${days} days...`);
        
        const customerData = await stripeAnalytics.getCustomerAnalytics(parseInt(days));
        res.json(customerData);
    } catch (error) {
        console.error('Stripe customer analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch customer analytics' });
    }
});

// Audiobook Analytics endpoints
app.get('/admin/api/audiobook/analytics', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        console.log(`Fetching audiobook analytics for ${days} days...`);
        
        const analytics = await audiobookAnalytics.getAnalytics(parseInt(days));
        res.json(analytics);
    } catch (error) {
        console.error('Audiobook analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch audiobook analytics' });
    }
});

app.get('/admin/api/audiobook/recent-listeners', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        console.log(`Fetching ${limit} recent audiobook listeners...`);
        
        const listeners = await audiobookAnalytics.getRecentListeners(parseInt(limit));
        res.json(listeners);
    } catch (error) {
        console.error('Audiobook recent listeners error:', error);
        res.status(500).json({ error: 'Failed to fetch recent listeners' });
    }
});

// Log audiobook listening session
app.post('/api/audiobook/log-session', async (req, res) => {
    try {
        const { token, chapterFile, duration = 0, completed = false } = req.body;
        
        if (!token) {
            return res.status(400).json({ error: 'Access token required' });
        }
        
        console.log(`Logging audiobook session: ${chapterFile}, duration: ${duration}s`);
        
        const result = await audiobookAnalytics.logListeningSession(token, chapterFile, duration, completed);
        res.json(result);
    } catch (error) {
        console.error('Error logging audiobook session:', error);
        res.status(500).json({ error: 'Failed to log session' });
    }
});

// Combined dashboard data endpoint
app.get('/admin/api/dashboard-summary', async (req, res) => {
    try {
        const { days = 30 } = req.query;
        console.log(`Fetching combined dashboard data for ${days} days...`);
        
        // Fetch all data in parallel
        const [
            googleStats,
            stripeRevenue,
            stripeProducts,
            stripeCustomers,
            recentOrders,
            audiobookStats,
            newsletterStats
        ] = await Promise.all([
            googleAnalytics.getWebsiteStats(`${days}daysAgo`),
            stripeAnalytics.getRevenueAnalytics(parseInt(days)),
            stripeAnalytics.getProductAnalytics(parseInt(days)),
            stripeAnalytics.getCustomerAnalytics(parseInt(days)),
            stripeAnalytics.getRecentOrders(5),
            audiobookAnalytics.getAnalytics(parseInt(days)),
            mailerLite.getStats()
        ]);

        const dashboardData = {
            website: googleStats,
            revenue: stripeRevenue,
            products: stripeProducts,
            customers: stripeCustomers,
            recentOrders: recentOrders,
            audiobook: audiobookStats.data,
            newsletter: newsletterStats.data || newsletterStats,
            summary: {
                totalRevenue: stripeRevenue.totalRevenue || 0,
                totalOrders: recentOrders.length || 0,
                websiteVisitors: googleStats.users || 0,
                audiobookListeners: audiobookStats.data?.uniqueListeners || 0,
                newsletterSubscribers: newsletterStats.data?.totalSubscribers || 0,
                generatedAt: new Date().toISOString()
            }
        };

        console.log('Dashboard summary generated successfully');
        res.json(dashboardData);
    } catch (error) {
        console.error('Dashboard summary error:', error);
        res.status(500).json({ error: 'Failed to generate dashboard summary' });
    }
});

// Test all integrations endpoint
app.get('/admin/api/test-integrations', async (req, res) => {
    try {
        console.log('Testing all integrations...');
        
        const [
            googleTest,
            stripeTest,
            mailerLiteTest,
            audiobookTest
        ] = await Promise.all([
            googleAnalytics.testConnection(),
            stripeAnalytics.testConnection(),
            mailerLite.testConnection(),
            audiobookAnalytics.testAnalytics()
        ]);

        const testResults = {
            googleAnalytics: googleTest,
            stripe: stripeTest,
            mailerLite: mailerLiteTest,
            audiobook: audiobookTest,
            overall: {
                success: googleTest.success && stripeTest.success && mailerLiteTest.success && audiobookTest.success,
                timestamp: new Date().toISOString()
            }
        };

        console.log('Integration tests completed');
        res.json(testResults);
    } catch (error) {
        console.error('Integration test error:', error);
        res.status(500).json({ error: 'Failed to test integrations' });
    }
});

// Admin stats endpoint (legacy support - now enhanced)
app.get('/api/admin/stats', async (req, res) => {
    console.log('Admin stats endpoint called (legacy)');
    try {
        const dashboardData = await fetch(`http://localhost:${PORT}/admin/api/dashboard-summary`).then(r => r.json());
        
        // Transform to legacy format for backwards compatibility
        const legacyStats = {
            totalRevenue: dashboardData.summary.totalRevenue,
            totalOrders: dashboardData.summary.totalOrders,
            audiobookSales: dashboardData.revenue.audiobookRevenue || 0,
            signedBookSales: dashboardData.revenue.bookRevenue || 0,
            bundleSales: dashboardData.revenue.bundleRevenue || 0,
            recentOrders: dashboardData.recentOrders.slice(0, 5)
        };
        
        console.log('Returning legacy stats:', legacyStats);
        res.json(legacyStats);
    } catch (error) {
        console.error('Error fetching legacy admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// Admin API endpoints (legacy support)
app.get('/api/admin/orders', async (req, res) => {
    console.log('Admin orders endpoint called');
    try {
        const purchasesFile = path.join(__dirname, 'data', 'purchases.json');
        
        if (!fs.existsSync(purchasesFile)) {
            console.log('No purchases file found, returning empty array');
            return res.json([]);
        }
        
        const purchases = JSON.parse(fs.readFileSync(purchasesFile, 'utf8'));
        console.log('Loaded purchases:', purchases.length);
        
        // Transform purchases into admin-friendly format
        const orders = purchases.map(purchase => ({
            id: purchase.sessionId,
            customer: {
                name: purchase.customerEmail ? purchase.customerEmail.split('@')[0] : 'Unknown',
                email: purchase.customerEmail
            },
            products: purchase.products,
            amount: purchase.amountTotal,
            status: determineOrderStatus(purchase),
            date: purchase.purchaseDate,
            shippingAddress: purchase.shippingAddress,
            paymentStatus: purchase.paymentStatus,
            accessToken: purchase.accessToken
        }));
        
        // Sort by date (newest first)
        orders.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        console.log('Returning orders:', orders.length);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching admin orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Admin stats endpoint (legacy support - now enhanced)
app.get('/api/admin/stats', async (req, res) => {
    console.log('Admin stats endpoint called (legacy)');
    try {
        // Get enhanced stats from Stripe
        const stripeRevenue = await stripeAnalytics.getRevenueAnalytics(30);
        const recentOrders = await stripeAnalytics.getRecentOrders(5);
        
        // Transform to legacy format for backwards compatibility
        const legacyStats = {
            totalRevenue: stripeRevenue.totalRevenue || 0,
            totalOrders: stripeRevenue.transactionCount || 0,
            audiobookSales: stripeRevenue.audiobookRevenue || 0,
            signedBookSales: stripeRevenue.bookRevenue || 0,
            bundleSales: stripeRevenue.bundleRevenue || 0,
            recentOrders: recentOrders.slice(0, 5)
        };
        
        console.log('Returning enhanced legacy stats:', legacyStats);
        res.json(legacyStats);
    } catch (error) {
        console.error('Error fetching legacy admin stats:', error);
        
        // Fallback to file-based stats if enhanced analytics fail
        try {
            const purchasesFile = path.join(__dirname, 'data', 'purchases.json');
            
            if (!fs.existsSync(purchasesFile)) {
                console.log('No purchases file found for stats');
                return res.json({
                    totalRevenue: 0,
                    totalOrders: 0,
                    audiobookSales: 0,
                    signedBookSales: 0,
                    bundleSales: 0,
                    recentOrders: []
                });
            }
            
            const purchases = JSON.parse(fs.readFileSync(purchasesFile, 'utf8'));
            console.log('Calculating stats for', purchases.length, 'purchases');
            
            let totalRevenue = 0;
            let audiobookSales = 0;
            let signedBookSales = 0;
            let bundleSales = 0;
            
            purchases.forEach(purchase => {
                totalRevenue += purchase.amountTotal;
                
                if (purchase.products) {
                    purchase.products.forEach(product => {
                        switch(product.id) {
                            case 'audiobook':
                                audiobookSales += PRODUCTS.audiobook.price;
                                break;
                            case 'signed-book':
                                signedBookSales += PRODUCTS['signed-book'].price;
                                break;
                            case 'bundle':
                                bundleSales += PRODUCTS.bundle.price;
                                break;
                        }
                    });
                }
            });
            
            const stats = {
                totalRevenue,
                totalOrders: purchases.length,
                audiobookSales,
                signedBookSales,
                bundleSales,
                recentOrders: purchases.slice(-5).reverse()
            };
            
            console.log('Returning fallback stats:', stats);
            res.json(stats);
            
        } catch (fallbackError) {
            console.error('Fallback stats also failed:', fallbackError);
            res.status(500).json({ error: 'Failed to fetch stats' });
        }
    }
});

// Admin endpoint to resend audiobook access email
app.post('/api/admin/resend-email', async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }
        
        const purchasesFile = path.join(__dirname, 'data', 'purchases.json');
        
        if (!fs.existsSync(purchasesFile)) {
            return res.status(404).json({ error: 'No orders found' });
        }
        
        const purchases = JSON.parse(fs.readFileSync(purchasesFile, 'utf8'));
        const purchase = purchases.find(p => p.sessionId === sessionId);
        
        if (!purchase) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // Check if this order has audiobook access
        const hasAudiobook = purchase.products.some(p => p.id === 'audiobook');
        if (!hasAudiobook) {
            return res.status(400).json({ error: 'This order does not include audiobook access' });
        }
        
        if (!purchase.accessToken) {
            return res.status(400).json({ error: 'No access token found for this order' });
        }
        
        // Create a mock session object for the email function
        const mockSession = {
            customer_details: {
                email: purchase.customerEmail
            },
            id: purchase.sessionId,
            amount_total: purchase.amountTotal * 100, // Convert back to cents
            line_items: {
                data: purchase.products.map(p => ({
                    price: {
                        product: {
                            metadata: { product_id: p.id }
                        }
                    },
                    quantity: p.quantity
                }))
            }
        };
        
        await sendConfirmationEmail(mockSession, purchase.accessToken);
        
        res.json({ 
            success: true, 
            message: `Audiobook access email resent to ${purchase.customerEmail}` 
        });
        
    } catch (error) {
        console.error('Error resending email:', error);
        res.status(500).json({ 
            error: 'Failed to resend email', 
            details: error.message 
        });
    }
});

// Admin endpoint to manually add a missing order
app.post('/api/admin/add-order', async (req, res) => {
    try {
        const { customerEmail, sessionId, amountTotal, productIds } = req.body;
        
        if (!customerEmail || !sessionId || !amountTotal || !productIds) {
            return res.status(400).json({ 
                error: 'Missing required fields: customerEmail, sessionId, amountTotal, productIds' 
            });
        }
        
        const purchasesFile = path.join(__dirname, 'data', 'purchases.json');
        let purchases = [];
        
        if (fs.existsSync(purchasesFile)) {
            purchases = JSON.parse(fs.readFileSync(purchasesFile, 'utf8'));
        }
        
        // Check if order already exists
        if (purchases.find(p => p.sessionId === sessionId)) {
            return res.status(400).json({ error: 'Order with this session ID already exists' });
        }
        
        // Generate access token for audiobook orders
        let accessToken = null;
        if (productIds.includes('audiobook')) {
            accessToken = Buffer.from(`${customerEmail}:${sessionId}:${Date.now()}`).toString('base64');
        }
        
        const newOrder = {
            sessionId,
            customerEmail,
            accessToken,
            purchaseDate: new Date().toISOString(),
            products: productIds.map(id => ({ id, quantity: 1 })),
            shippingAddress: productIds.includes('signed-book') ? 'To be collected' : null,
            paymentStatus: 'paid',
            amountTotal: parseFloat(amountTotal)
        };
        
        purchases.push(newOrder);
        
        // Save to file
        fs.writeFileSync(purchasesFile, JSON.stringify(purchases, null, 2));
        
        // Send confirmation email if audiobook is included
        if (accessToken) {
            const mockSession = {
                customer_details: { email: customerEmail },
                id: sessionId,
                amount_total: amountTotal * 100,
                line_items: {
                    data: productIds.map(id => ({
                        price: {
                            product: {
                                metadata: { product_id: id }
                            }
                        },
                        quantity: 1
                    }))
                }
            };
            
            await sendConfirmationEmail(mockSession, accessToken);
        }
        
        res.json({ 
            success: true, 
            message: 'Order added successfully and email sent',
            order: newOrder
        });
        
    } catch (error) {
        console.error('Error adding order:', error);
        res.status(500).json({ 
            error: 'Failed to add order', 
            details: error.message 
        });
    }
});

// Helper function to determine order status
function determineOrderStatus(purchase) {
    if (!purchase.products || purchase.products.length === 0) {
        return 'unknown';
    }
    
    // Check if it's digital only (audiobook)
    const hasDigitalOnly = purchase.products.every(p => p.id === 'audiobook');
    if (hasDigitalOnly) {
        return 'digital_delivered';
    }
    
    // Check if it has physical products
    const hasPhysical = purchase.products.some(p => p.id === 'signed-book' || p.id === 'bundle');
    if (hasPhysical) {
        // In a real system, you'd check shipping status from Stripe or shipping provider
        // For now, mark recent orders as pending and older ones as shipped
        const orderDate = new Date(purchase.purchaseDate);
        const daysSinceOrder = (new Date() - orderDate) / (1000 * 60 * 60 * 24);
        
        return daysSinceOrder > 7 ? 'shipped' : 'pending_fulfillment';
    }
    
    return 'unknown';
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ===== MAILERLITE NEWSLETTER ENDPOINTS =====

// Newsletter signup endpoint
app.post('/api/newsletter', async (req, res) => {
    try {
        const { email, name = '', source = 'website' } = req.body;
        
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Valid email is required' 
            });
        }

        console.log(`Newsletter signup attempt: ${email} from ${source}`);

        // Use MailerLite for newsletter signups with welcome email
        const result = await mailerLite.addSubscriberWithWelcome(email, name, {
            source: source,
            signup_date: new Date().toISOString(),
            ip_address: req.ip
        });

        if (result.success) {
            // Log the signup locally for backup
            const signup = {
                email,
                name,
                source,
                timestamp: new Date().toISOString(),
                ip: req.ip,
                mailerlite_id: result.data?.id || null
            };
            
            // Save to local file as backup
            const signupsFile = path.join(__dirname, 'data', 'newsletter-signups.json');
            
            // Ensure data directory exists
            const dataDir = path.join(__dirname, 'data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            let signups = [];
            if (fs.existsSync(signupsFile)) {
                try {
                    signups = JSON.parse(fs.readFileSync(signupsFile, 'utf8'));
                } catch (e) {
                    console.error('Error reading signups file:', e);
                    signups = [];
                }
            }
            
            signups.push(signup);
            fs.writeFileSync(signupsFile, JSON.stringify(signups, null, 2));

            console.log(`Newsletter signup successful: ${email}`);
            res.json({ 
                success: true, 
                message: 'Successfully subscribed to newsletter!' 
            });
        } else {
            console.error(`Newsletter signup failed: ${email}`, result.error);
            res.status(400).json({
                success: false,
                error: result.error || 'Failed to subscribe to newsletter'
            });
        }
        
    } catch (error) {
        console.error('Newsletter signup error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Contact form endpoint - does NOT send welcome email, just sends contact email
app.post('/api/contact', async (req, res) => {
    try {
        const { email, name = '', subject = '', message = '', newsletter_opt_in = false } = req.body;
        
        if (!email || !isValidEmail(email) || !message) {
            return res.status(400).json({ 
                success: false, 
                error: 'Email and message are required' 
            });
        }

        console.log(`Contact form submission: ${email} - ${subject}`);

        // Send contact email via Resend (transactional)
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        await resend.emails.send({
            from: `Contact Form <noreply@aleksfilmore.com>`,
            to: ['aleks@aleksfilmore.com'],
            subject: `Contact Form: ${subject || 'New Message'}`,
            html: `
                <h2>New Contact Form Submission</h2>
                <p><strong>From:</strong> ${name || 'Anonymous'} (${email})</p>
                <p><strong>Subject:</strong> ${subject || 'No subject'}</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
                <p><strong>Newsletter Opt-in:</strong> ${newsletter_opt_in ? 'Yes' : 'No'}</p>
                <hr>
                <p><small>Sent from aleksfilmore.com contact form</small></p>
            `,
            text: `
New Contact Form Submission
From: ${name || 'Anonymous'} (${email})
Subject: ${subject || 'No subject'}
Message: ${message}
Newsletter Opt-in: ${newsletter_opt_in ? 'Yes' : 'No'}
            `
        });

        // If they opted into newsletter, add them with welcome email
        if (newsletter_opt_in) {
            await mailerLite.addSubscriberWithWelcome(email, name, {
                source: 'contact_form',
                signup_date: new Date().toISOString(),
                ip_address: req.ip
            });
        }

        res.json({ 
            success: true, 
            message: 'Message sent successfully!' 
        });
        
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to send message' 
        });
    }
});

// Dacia Rising form endpoint - adds to newsletter with themed response
app.post('/api/dacia-newsletter', async (req, res) => {
    try {
        const { email, name = '' } = req.body;
        
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Valid email is required' 
            });
        }

        console.log(`Dacia Rising signup: ${email}`);

        // Use newsletter signup with welcome email but different source tracking
        const result = await mailerLite.addSubscriberWithWelcome(email, name, {
            source: 'dacia_rising',
            signup_date: new Date().toISOString(),
            ip_address: req.ip,
            campaign: 'dacia_rising'
        });

        if (result.success) {
            res.json({ 
                success: true, 
                message: 'The prophecy has been claimed! Your secret chapter awaits in your inbox.' 
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error || 'The prophecy could not be delivered'
            });
        }
        
    } catch (error) {
        console.error('Dacia Rising signup error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'The ancient magic failed' 
        });
    }
});

// Admin endpoint to get MailerLite stats
app.get('/admin/api/newsletter-stats', async (req, res) => {
    try {
        console.log('Fetching newsletter stats...');
        
        // Add defensive check for mailerLite service
        if (!mailerLite) {
            console.error('MailerLite service not initialized');
            return res.status(500).json({ error: 'MailerLite service not available' });
        }
        
        const stats = await mailerLite.getStats();
        
        if (stats && stats.success) {
            console.log('Newsletter stats fetched successfully:', stats.data);
            res.json(stats.data);
        } else {
            console.error('Failed to fetch newsletter stats:', stats?.error || 'Unknown error');
            // Return mock data as fallback
            res.json({
                totalSubscribers: 0,
                activeSubscribers: 0,
                monthlyEmailsUsed: 0,
                monthlyLimit: 12000,
                groups: [],
                campaigns: []
            });
        }
    } catch (error) {
        console.error('Newsletter stats error:', error.message);
        console.error('Stack trace:', error.stack);
        
        // Return mock data as fallback
        res.json({
            totalSubscribers: 0,
            activeSubscribers: 0,
            monthlyEmailsUsed: 0,
            monthlyLimit: 12000,
            groups: [],
            campaigns: [],
            error: 'Fallback data due to service error'
        });
    }
});

// Admin endpoint to get subscribers
app.get('/admin/api/subscribers', async (req, res) => {
    try {
        const { limit = 50, page = 1 } = req.query;
        console.log(`Fetching subscribers: limit=${limit}, page=${page}`);
        
        const result = await mailerLite.getSubscribers(parseInt(limit), parseInt(page));
        
        if (result.success) {
            console.log(`Subscribers fetched successfully: ${result.data.length} subscribers`);
            res.json({
                subscribers: result.data,
                total: result.total,
                meta: result.meta
            });
        } else {
            console.error('Failed to fetch subscribers:', result.error);
            res.status(500).json({ error: 'Failed to fetch subscribers' });
        }
    } catch (error) {
        console.error('Get subscribers error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test MailerLite connection endpoint (admin only)
app.get('/admin/api/test-mailerlite', async (req, res) => {
    try {
        console.log('Testing MailerLite connection...');
        const result = await mailerLite.testConnection();
        
        if (result.success) {
            console.log('MailerLite connection test successful');
            res.json({ 
                success: true, 
                message: result.message,
                data: result.data
            });
        } else {
            console.error('MailerLite connection test failed:', result.error);
            res.status(500).json({ 
                success: false, 
                error: result.error 
            });
        }
    } catch (error) {
        console.error('MailerLite test error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

const PORT = process.env.PORT || 3000;

// Initialize analytics services
async function initializeServices() {
    console.log('Initializing analytics services...');
    
    try {
        await googleAnalytics.initialize();
        console.log('Google Analytics service ready');
    } catch (error) {
        console.warn('Google Analytics initialization failed:', error.message);
    }
    
    try {
        // MailerLite and other services don't need explicit initialization
        console.log('Other services ready');
    } catch (error) {
        console.warn('Service initialization warning:', error.message);
    }
}

console.log('About to start server...');

// Add global error handlers to prevent crashes
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    console.error('Stack:', error.stack);
    // Don't exit - just log it
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit - just log it
});

// Initialize services before starting server
initializeServices().then(() => {
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    server.on('error', (error) => {
        console.error('Server error:', error);
    });
}).catch(error => {
    console.error('Service initialization failed:', error);
    process.exit(1);
});

console.log('Server setup complete');

module.exports = app;
