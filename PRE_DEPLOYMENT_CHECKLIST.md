# 🚀 PRE-DEPLOYMENT CHECKLIST
## Final Details Before Going Live on Netlify

### ✅ COMPLETED
- [x] Stripe live API keys configured
- [x] Webhook endpoint created and secret obtained
- [x] Resend API key configured
- [x] Domain already set up on Netlify
- [x] All website pages created and functional
- [x] Audiobook player with 34 tracks ready

### 🔧 CRITICAL FIXES NEEDED

#### 1. EMAIL CONFIGURATION ISSUE ⚠️
**Problem**: Server.js has inconsistent email configuration
- Line 412: Uses `process.env.EMAIL_USER` (not defined in .env)
- Line 560: Uses `aleks@aleksfilmore.com` (hardcoded)

**Solution**: Need to fix email sending configuration

#### 2. DOMAIN VERIFICATION IN RESEND ⚠️
**Problem**: Need to verify `aleksfilmore.com` domain in Resend dashboard
**Action Required**: 
- Go to Resend dashboard → Domains
- Add and verify `aleksfilmore.com`
- Add DNS records as instructed

#### 3. NETLIFY ENVIRONMENT VARIABLES ⚠️
**Problem**: Need to add all environment variables to Netlify
**Action Required**: Add these to Netlify Site Settings → Environment Variables:
```
STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_publishable_key_here
STRIPE_SECRET_KEY=sk_live_your_actual_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here
RESEND_API_KEY=re_your_actual_resend_key_here
SITE_URL=https://aleksfilmore.com
BASE_URL=https://aleksfilmore.com
SESSION_SECRET=your_random_session_secret_here
```

#### 4. NETLIFY FUNCTIONS SETUP ⚠️
**Problem**: Netlify needs serverless functions for API endpoints
**Action Required**: Need to restructure for Netlify deployment

#### 5. DATABASE/STORAGE SOLUTION ⚠️
**Problem**: Currently using in-memory storage (Map objects)
**Issue**: Will reset on every deployment
**Solution**: Need persistent storage for:
- Access tokens
- Purchase records

### 🛠 IMMEDIATE ACTION PLAN

#### Step 1: Fix Email Configuration (5 minutes)
```javascript
// Update server.js to use consistent email address
// Replace process.env.EMAIL_USER with 'aleks@aleksfilmore.com'
```

#### Step 2: Verify Domain in Resend (10 minutes)
1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add `aleksfilmore.com`
3. Add required DNS records to your domain

#### Step 3: Choose Deployment Strategy
**Option A: Convert to Netlify Functions** (Recommended)
- Restructure API endpoints as Netlify functions
- Move server endpoints to `/netlify/functions/`

**Option B: Use Different Hosting**
- Deploy to Railway/Vercel/Heroku instead
- Keep current Node.js server structure

**Option C: Hybrid Approach**
- Keep static site on Netlify
- Deploy API server separately (Railway/Heroku)
- Update API URLs in frontend

### 📋 NETLIFY-SPECIFIC REQUIREMENTS

If staying with Netlify, need to:

1. **Create `netlify.toml`**:
```toml
[build]
  command = "npm run build"
  functions = "netlify/functions"

[dev]
  command = "npm run dev"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

2. **Convert API endpoints to Netlify functions**
3. **Set up database** (Supabase/PlanetScale for persistent storage)

### 🚨 CURRENT BLOCKERS

1. **Email sending will fail** (domain not verified)
2. **Purchase records won't persist** (in-memory storage)
3. **API endpoints won't work on Netlify** (needs functions)

### 💡 RECOMMENDED NEXT STEPS

1. **Fix email configuration** (I can help with this)
2. **Verify domain in Resend**
3. **Decide on deployment approach**
4. **Set up persistent database**

Would you like me to help fix the email configuration first, or would you prefer to discuss the deployment strategy?
