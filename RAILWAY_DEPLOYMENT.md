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
STRIPE_PUBLISHABLE_KEY=pk_live_51RyeOz5SMnEa5xV174Ii8H14pZa3KxUYPIxJpIRMa36HxWOYCKxEMbFccn3rRfWvVzq7pZum2cpLpM7Id9o49mI300xrHVP1Fc
STRIPE_SECRET_KEY=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
STRIPE_WEBHOOK_SECRET=whsec_NGTtLuqdQ6QyzRHThRftxJsCsEV8mJLA
RESEND_API_KEY=re_frsyZKmT_P7tzjaPWyneDQvT1zWEkZXQL
SITE_URL=https://aleksfilmore.com
BASE_URL=https://aleksfilmore.com
SESSION_SECRET=aleks_filmore_2025_secure_session_key_random_string_xyz789
```

### 4. Get Your Railway API URL
Railway will give you a URL like: `https://your-project.railway.app`

This is your backend API endpoint.
