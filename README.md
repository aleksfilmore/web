# Aleks Filmore Author Website

A complete e-commerce solution for selling audiobooks and signed copies directly to readers, featuring Stripe integration and a protected audiobook streaming player.

## Features

- 🎧 **Direct Audiobook Sales** - Sell audiobooks with instant access
- 📚 **Signed Copy Sales** - Physical book sales with shipping
- 💳 **Stripe Integration** - Secure payment processing
- 🔒 **Protected Content** - Token-based access to audiobook player
- 📱 **Responsive Design** - Mobile-first, Spotify-inspired player
- 📧 **Email Notifications** - Automated order confirmations
- 🎁 **Bundle Offers** - Audiobook + signed copy packages
- 📦 **Shipping Management** - International shipping with address collection

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `STRIPE_SECRET_KEY` - Your Stripe secret key  
- `STRIPE_WEBHOOK_SECRET` - Webhook endpoint secret
- `EMAIL_USER` - Gmail address for order emails
- `EMAIL_PASS` - Gmail app-specific password
- `SITE_URL` - Your website URL

### 3. Set Up Stripe

1. Create a [Stripe account](https://stripe.com)
2. Get your API keys from the Dashboard
3. Set up a webhook endpoint pointing to `/webhook`
4. Add the webhook secret to your `.env`

### 4. Configure Email

1. Enable 2-factor authentication on Gmail
2. Generate an app-specific password
3. Add credentials to `.env`

### 5. Add Audio Files

Place your audiobook MP3 files in the `/audio` directory:
- `intro.mp3`
- `chapter-01.mp3` through `chapter-25.mp3`
- `bonus-epilogue.mp3`

### 6. Run Setup

```bash
node setup.js
```

### 7. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your site.

## File Structure

```
/
├── server.js              # Express server with Stripe integration
├── shop.html             # Main shop page with cart functionality
├── audiobook-player.html # Protected streaming player
├── order-confirmation.html # Success page for physical orders
├── index-new.html        # Homepage
├── about.html           # Author bio and press kit
├── midway.html          # Easter egg red flags page
├── audio/               # Audiobook MP3 files
├── data/                # Purchase records (JSON files)
└── package.json         # Dependencies and scripts
```

## Key Pages

### Shop (`/shop`)
- Product display for audiobook and signed copies
- Shopping cart with local storage
- Bundle pricing with discounts
- Stripe Checkout integration

### Audiobook Player (`/audiobook-player`)
- Token-based access verification
- Spotify-inspired interface
- Chapter navigation
- Speed controls and bookmarking
- Progress saving

### Order Confirmation (`/order-confirmation`)
- Post-purchase success page for physical items
- Shipping information
- Customer support links

## API Endpoints

- `POST /api/create-checkout-session` - Create Stripe checkout
- `GET /api/verify-access` - Verify audiobook access token
- `GET /api/audiobook/:filename` - Stream protected audio files
- `POST /webhook` - Stripe webhook for order processing

## Security Features

- Content Security Policy (CSP) headers
- CORS protection
- Rate limiting on API endpoints
- Token-based audiobook protection
- Secure audio file serving

## Deployment

### Heroku
1. Create a Heroku app
2. Set environment variables in Heroku dashboard
3. Deploy via Git or GitHub integration

### Vercel/Netlify
For static deployment, use the HTML files directly and implement serverless functions for the API endpoints.

### VPS/Traditional Hosting
1. Install Node.js 16+
2. Clone repository
3. Run `npm install`
4. Set environment variables
5. Use PM2 or similar for process management

## Customization

### Styling
- Built with Tailwind CSS
- Custom CSS variables for brand colors
- Spotify-inspired player design

### Products
Edit the `PRODUCTS` object in `server.js` to modify:
- Pricing
- Product descriptions
- Product types (digital/physical/bundle)

### Email Templates
Modify the `sendConfirmationEmail` function in `server.js` to customize order confirmation emails.

## Support

For questions about this implementation:
- Email: hello@aleksfilmore.com
- Check the Issues tab for common problems

## License

This is a custom implementation for Aleks Filmore. Contact for licensing inquiries.
This is the official landing page for Aleks Filmore's books, built for deployment via GitHub + Netlify.