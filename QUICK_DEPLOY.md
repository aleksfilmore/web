# 🚀 Quick Deployment Guide
## Get your website live in 30 minutes

### 1. Complete Stripe Setup (5 minutes)
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **API Keys**
3. Copy your **Live Secret Key** (starts with `sk_live_`)
4. Go to **Developers** → **Webhooks**
5. Click **Add endpoint**
6. URL: `https://yourdomain.com/webhook`
7. Events: Select `checkout.session.completed`
8. Copy the **Webhook Secret** (starts with `whsec_`)

### 2. Update Environment Variables
Open your `.env` file and update:
```bash
STRIPE_SECRET_KEY=sk_live_your_actual_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here
SITE_URL=https://aleksfilmore.com
SESSION_SECRET=your_random_string_here
```

### 3. Deploy to Vercel (15 minutes)
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (run from your project directory)
vercel --prod

# Add environment variables in Vercel dashboard
# Go to your project → Settings → Environment Variables
# Add all variables from your .env file
```

### 4. Test Everything (10 minutes)
1. Visit your live site
2. Try purchasing the audiobook with a test card
3. Check email delivery
4. Test audiobook player access
5. Verify all navigation works

### 🎉 You're Live!

### Stripe Test Cards for Testing
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- Use any future date for expiry, any 3-digit CVC

### Need Help?
- **Stripe Issues**: [Stripe Support](https://support.stripe.com)
- **Vercel Issues**: [Vercel Docs](https://vercel.com/docs)
- **Email Issues**: [Resend Support](https://resend.com/support)

---
**Your website is ready to make money! 💰**
