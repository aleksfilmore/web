# 🔗 Update Stripe Webhook URL

## After Railway Deployment

1. **Get your Railway URL** from the Railway dashboard
   - Example: `https://web-production-abcd.railway.app`

2. **Update Stripe Webhook**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Find your "fascinating-rhythm" webhook
   - Click "Edit"
   - Update Endpoint URL to: `https://your-railway-url.railway.app/webhook`
   - Save changes

3. **Update CORS Settings**
   - Your Railway backend will accept requests from aleksfilmore.com
   - CORS is already configured in server.js

## Test the Integration

1. **Frontend**: `https://aleksfilmore.com` (Netlify)
2. **Backend**: `https://your-project.railway.app` (Railway)
3. **Webhook**: `https://your-project.railway.app/webhook` (Stripe → Railway)
