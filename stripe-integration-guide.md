# Stripe Integration for Audiobook Access

## Current Setup
Your audiobook page uses direct Stripe Payment Links that redirect to external Stripe checkout. After payment, customers need access to the audiobook player.

## Recommended Production Flow

### 1. Stripe Webhook Integration
Set up a webhook endpoint to receive payment confirmations:

```javascript
// Example webhook handler (would be on your server)
app.post('/stripe-webhook', express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.log(`Webhook signature verification failed.`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle successful payment
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // Generate unique access token
        const accessToken = generateAudiobookToken();
        
        // Store in database with customer email
        await storeCustomerAccess({
            email: session.customer_details.email,
            token: accessToken,
            product: 'audiobook',
            purchaseDate: new Date(),
            stripeSessionId: session.id
        });
        
        // Send access email
        await sendAudiobookAccess(session.customer_details.email, accessToken);
    }

    res.status(200).send('Received');
});
```

### 2. Token Generation
```javascript
function generateAudiobookToken() {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    return `ab_${timestamp}_${randomString}`;
}
```

### 3. Access Email Template
```html
<!DOCTYPE html>
<html>
<head>
    <title>Your Audiobook Access - The Worst Boyfriends Ever</title>
</head>
<body>
    <h1>🎧 Your Audiobook is Ready!</h1>
    
    <p>Thank you for purchasing "The Worst Boyfriends Ever" audiobook!</p>
    
    <p>Click the link below to access your audiobook with the exclusive bonus epilogue:</p>
    
    <a href="https://aleksfilmore.com/audiobook-player.html?token={{ACCESS_TOKEN}}&email={{CUSTOMER_EMAIL}}" 
       style="background: #FF3B3B; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 50px;">
        🎧 Listen Now
    </a>
    
    <p><strong>Bookmark this link!</strong> You can access your audiobook anytime.</p>
    
    <p>Enjoy the chaos!<br>
    Aleks 🏳️‍🌈</p>
</body>
</html>
```

### 4. Current Temporary Solution
For now, you can manually generate access links after receiving Stripe payment notifications:

1. **Monitor Stripe Dashboard** for new payments
2. **Generate access link** using one of the valid tokens:
   - `ab_2024_twbe_premium_access`
   - `ab_2024_bundle_premium`
3. **Send manual email** with access link:
   ```
   https://aleksfilmore.com/audiobook-player.html?token=ab_2024_twbe_premium_access&email=customer@email.com
   ```

### 5. Token Management
Current valid tokens in the system:
- `ab_2024_twbe_premium_access` - Main audiobook access
- `ab_2024_bundle_premium` - Bundle purchase access  
- `ab_demo_preview_2024` - Demo/preview access

### 6. Customer Support
If customers lose their access link:
1. Verify their purchase in Stripe
2. Generate new access link with their email
3. Send them the new link

## Security Notes
- Tokens are currently static for simplicity
- In production, use dynamic tokens tied to specific purchases
- Consider token expiration for enhanced security
- Store customer access records for support purposes

## Future Enhancements
1. **Automatic email delivery** via Stripe webhooks
2. **Customer portal** for re-downloading access links
3. **Token expiration** and renewal system
4. **Purchase verification** API integration
5. **Analytics tracking** for audiobook usage
