# 🔗 Stripe Webhook Setup Guide
## Configure Stripe to send payment notifications to your website

### 📍 BEFORE YOU START
Make sure your website is deployed and accessible at your live URL. If you haven't deployed yet, you can still set up the webhook but you'll need to update the URL later.

### 🎯 STEP-BY-STEP WEBHOOK CONFIGURATION

#### Step 1: Access Stripe Dashboard
1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Make sure you're in **Live mode** (toggle in top-left should show "Live")
3. Navigate to **Developers** → **Webhooks**

#### Step 2: Create New Webhook Endpoint
1. Click **"Add endpoint"** button
2. Fill in the webhook details:

**Endpoint URL:** `https://aleksfilmore.com/webhook`
*(Replace aleksfilmore.com with your actual domain)*

**Description:** `Aleks Filmore Website - Order Processing`

#### Step 3: Select Events to Listen For
In the "Events to send" section, select these specific events:
- ✅ `checkout.session.completed` (REQUIRED)
- ✅ `payment_intent.succeeded` (Optional but recommended)
- ✅ `invoice.payment_succeeded` (For subscription support if added later)

**Quick Selection Method:**
- Click **"Select events"**
- Search for "checkout.session.completed"
- Check the box next to it
- Click **"Add events"**

#### Step 4: Save and Get Webhook Secret
1. Click **"Add endpoint"** to create the webhook
2. You'll be redirected to the webhook details page
3. Look for **"Signing secret"** section
4. Click **"Reveal"** to show the webhook secret
5. Copy the secret (starts with `whsec_`)

#### Step 5: Update Your Environment Variables
Open your `.env` file and update:
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here
```

### 🧪 TESTING YOUR WEBHOOK

#### Option 1: Test with Stripe CLI (Recommended for development)
```bash
# Install Stripe CLI
# Download from: https://github.com/stripe/stripe-cli/releases

# Login to Stripe
stripe login

# Forward events to your local server
stripe listen --forward-to localhost:3000/webhook
```

#### Option 2: Test with Live Payments
1. Start your server locally: `node server.js`
2. Use ngrok to expose your local server:
   ```bash
   # Install ngrok: https://ngrok.com/download
   ngrok http 3000
   ```
3. Update webhook URL to your ngrok URL: `https://your-ngrok-url.ngrok.io/webhook`
4. Make a test purchase

### 🔧 WEBHOOK ENDPOINT DETAILS

**Your webhook endpoint handles these events:**
- **checkout.session.completed**: Triggered when payment is successful
- **Automatically sends audiobook access email**
- **Generates unique access token for customer**
- **Creates purchase record**

**Security features:**
- ✅ Webhook signature verification
- ✅ Stripe event validation
- ✅ Duplicate event protection

### 🚨 COMMON WEBHOOK ISSUES & FIXES

#### Issue 1: "Webhook endpoint not responding"
**Solution:** Make sure your server is running and accessible at the webhook URL

#### Issue 2: "Invalid signature"
**Solution:** Verify your webhook secret is correct in `.env` file

#### Issue 3: "Events not being processed"
**Solution:** Check server logs for errors:
```bash
node server.js
# Look for webhook-related console.log messages
```

### 📝 WEBHOOK TESTING CHECKLIST
- [ ] Webhook endpoint created in Stripe dashboard
- [ ] Correct URL configured (https://yourdomain.com/webhook)
- [ ] `checkout.session.completed` event selected
- [ ] Webhook secret copied to `.env` file
- [ ] Server running and accessible
- [ ] Test purchase completed successfully
- [ ] Customer receives audiobook access email
- [ ] Audiobook player works with provided token

### 🎉 VERIFICATION
After setup, test your webhook by:
1. Making a test purchase on your site
2. Check Stripe webhook logs for successful delivery
3. Verify customer receives access email
4. Test audiobook player access

### 🔍 MONITORING WEBHOOKS
In Stripe Dashboard → Developers → Webhooks:
- **Green checkmarks**: Successful deliveries
- **Red X marks**: Failed deliveries
- **Click any event**: View detailed logs and retry failed events

---
**Once your webhook is configured, your e-commerce system will be fully automated! 🚀**
