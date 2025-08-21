// Test script to verify webhook functionality
// Run this with: node test-webhook.js

const express = require('express');
const app = express();

// Middleware to capture raw body for webhook verification
app.use('/webhook', express.raw({type: 'application/json'}));
app.use(express.json());

// Test webhook endpoint
app.post('/webhook', (req, res) => {
    console.log('🎉 Webhook received!');
    console.log('Headers:', req.headers);
    console.log('Body length:', req.body.length);
    
    // Check for Stripe signature
    const sig = req.headers['stripe-signature'];
    if (sig) {
        console.log('✅ Stripe signature present:', sig.substring(0, 20) + '...');
    } else {
        console.log('❌ No Stripe signature found');
    }
    
    // Try to parse the body as JSON for inspection
    try {
        const event = JSON.parse(req.body.toString());
        console.log('📦 Event type:', event.type);
        console.log('📧 Customer email:', event.data?.object?.customer_email || 'Not found');
        console.log('💰 Amount:', event.data?.object?.amount_total || 'Not found');
    } catch (error) {
        console.log('❌ Could not parse webhook body as JSON');
    }
    
    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🧪 Webhook test server running on port ${PORT}`);
    console.log(`📍 Webhook endpoint: http://localhost:${PORT}/webhook`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log('\n📋 To test with Stripe CLI:');
    console.log(`stripe listen --forward-to localhost:${PORT}/webhook`);
});
