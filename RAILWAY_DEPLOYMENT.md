# 🚂 Railway Backend Deployment Guide

## Quick Railway Setup

### 1. Create Railway Account
- Go to [railway.app](https://railway.app)
- Sign up with GitHub

### 2. Deploy Your Backend
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create new project
railway new

# Deploy current directory
railway up
```

### 3. Add Environment Variables in Railway Dashboard
After deployment, go to Railway dashboard and add these variables:

```
STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_actual_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here
RESEND_API_KEY=re_your_actual_resend_key_here
SITE_URL=https://aleksfilmore.com
BASE_URL=https://aleksfilmore.com
SESSION_SECRET=your_random_session_secret_here
```

### 4. Get Your Railway API URL
Railway will give you a URL like: `https://your-project.railway.app`

This is your backend API endpoint.
