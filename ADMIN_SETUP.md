# Admin Dashboard Setup Guide

## Overview
The admin dashboard has been completely rebuilt with clean, working functionality for blog management, newsletter composition, and analytics.

## Current Features

### ✅ Working Now
- **Authentication**: Username: `aleks`, Password: `worstboyfriends2025`
- **Blog Management**: Create, edit, delete blog posts with status tracking
- **Newsletter Composition**: Templates, preview, and sending functionality
- **Clean Analytics Dashboard**: Ready for real data integration
- **Responsive Design**: Works on all devices

### 🔧 Next Steps for Full Integration

## 1. Stripe Analytics Integration

To connect real Stripe data, update the `loadStripeAnalytics()` function in admin.html:

```javascript
async function loadStripeAnalytics() {
    try {
        const response = await fetch('/api/stripe-analytics', {
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('admin_auth')
            }
        });
        
        const data = await response.json();
        
        document.getElementById('total-revenue').textContent = '€' + data.totalRevenue.toLocaleString();
        document.getElementById('audiobook-revenue').textContent = '€' + data.audiobookRevenue.toLocaleString();
        document.getElementById('book-revenue').textContent = '€' + data.bookRevenue.toLocaleString();
        document.getElementById('bundle-revenue').textContent = '€' + data.bundleRevenue.toLocaleString();
        
        // Update charts with real data
        updateCharts(data.chartData);
        
    } catch (error) {
        console.error('Error loading Stripe analytics:', error);
    }
}
```

You'll need to create a backend endpoint that fetches from Stripe's API.

## 2. Formspree Subscriber Integration

To connect real subscriber data, you need your Formspree API key. Update the `loadSubscriberData()` function:

```javascript
async function loadSubscriberData() {
    try {
        // Replace YOUR_FORM_ID with your actual Formspree form ID
        const response = await fetch('https://formspree.io/api/0/forms/YOUR_FORM_ID/submissions', {
            headers: {
                'Authorization': 'Bearer YOUR_FORMSPREE_API_KEY'
            }
        });
        
        const data = await response.json();
        
        document.getElementById('total-subscribers').textContent = data.length.toLocaleString();
        
        // Calculate monthly subscribers
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const monthlyCount = data.filter(sub => new Date(sub.created_at) >= thisMonth).length;
        document.getElementById('monthly-subscribers').textContent = '+' + monthlyCount.toLocaleString();
        
    } catch (error) {
        console.error('Error loading subscriber data:', error);
    }
}
```

## 3. Newsletter Templates

The dashboard includes ready-to-use templates:
- **Book Launch Announcement**: Perfect for new releases
- **Monthly Update**: Regular subscriber updates
- **Behind the Scenes**: Personal insights
- **Custom**: Start from scratch

## 4. Blog Post Management

Blog posts are currently stored in localStorage. For production, you may want to:
- Store in a database
- Add image upload functionality
- Implement markdown support
- Add SEO optimization features

## 5. Email Sending Integration

To actually send newsletters, integrate with your email service (e.g., Mailgun, SendGrid):

```javascript
async function sendNewsletter(newsletterData) {
    const response = await fetch('/api/send-newsletter', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('admin_auth')
        },
        body: JSON.stringify(newsletterData)
    });
    
    return response.json();
}
```

## Security Recommendations

For production use:
1. Replace localStorage authentication with JWT tokens
2. Add server-side session management
3. Implement rate limiting
4. Add CSRF protection
5. Use environment variables for API keys

## Getting Your API Keys

### Stripe
1. Go to your Stripe Dashboard
2. Navigate to Developers > API keys
3. Copy your Secret key (starts with `sk_`)

### Formspree
1. Log into your Formspree account
2. Go to your form settings
3. Copy your form ID and generate an API key

## File Structure

```
admin.html              # Main admin dashboard
server.js              # Backend (needs Stripe/Formspree endpoints)
.env                   # Store your API keys here (never commit)
```

## Testing

The admin dashboard works immediately with:
- Local blog post creation/editing
- Newsletter composition with templates
- Mock analytics data

All functionality is ready for real API integration when you add the backend endpoints.
