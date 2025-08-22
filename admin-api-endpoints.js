// Enhanced server.js API endpoints for Admin Dashboard integration
// Add these endpoints to your existing server.js file

// Admin Authentication Middleware
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    // Simple token validation (in production, use proper JWT validation)
    if (token === 'authenticated') {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
}

// Stripe Analytics API
app.get('/api/stripe-analytics', requireAuth, async (req, res) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        // Get payments from last 30 days
        const payments = await stripe.paymentIntents.list({
            created: {
                gte: Math.floor(thirtyDaysAgo.getTime() / 1000)
            },
            limit: 100
        });

        // Calculate analytics
        let totalSales = 0;
        let audiobookSales = 0;
        let bookSales = 0;
        const recentTransactions = [];
        const salesByDate = {};

        payments.data.forEach(payment => {
            if (payment.status === 'succeeded') {
                const amount = payment.amount / 100; // Convert from cents
                totalSales += amount;
                
                // Categorize by product (you may need to enhance this based on your metadata)
                if (payment.metadata && payment.metadata.product_type === 'audiobook') {
                    audiobookSales += amount;
                } else if (payment.metadata && payment.metadata.product_type === 'signed-book') {
                    bookSales += amount;
                }

                // Add to recent transactions
                if (recentTransactions.length < 10) {
                    recentTransactions.push({
                        date: new Date(payment.created * 1000).toISOString().split('T')[0],
                        product: payment.metadata?.product_name || 'Unknown',
                        amount: amount,
                        customer: payment.receipt_email || 'Anonymous',
                        status: 'completed'
                    });
                }

                // Group by date for chart
                const date = new Date(payment.created * 1000).toISOString().split('T')[0];
                salesByDate[date] = (salesByDate[date] || 0) + amount;
            }
        });

        // Get newsletter subscriber count (you'll need to implement this based on your system)
        const newsletterSubs = 1247; // Placeholder

        res.json({
            totalSales: totalSales,
            audiobookSales: audiobookSales,
            bookSales: bookSales,
            newsletterSubs: newsletterSubs,
            salesData: Object.entries(salesByDate).map(([date, amount]) => ({ date, amount })),
            recentTransactions: recentTransactions
        });

    } catch (error) {
        console.error('Stripe analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Update Pricing API
app.post('/api/update-pricing', requireAuth, async (req, res) => {
    try {
        const { product, price } = req.body;
        
        // Update price in Stripe
        let priceId;
        if (product === 'audiobook') {
            priceId = process.env.STRIPE_AUDIOBOOK_PRICE_ID;
        } else if (product === 'signed-book') {
            priceId = process.env.STRIPE_SIGNED_BOOK_PRICE_ID;
        }

        if (priceId) {
            // Create new price (Stripe doesn't allow updating existing prices)
            const newPrice = await stripe.prices.create({
                unit_amount: Math.round(price * 100), // Convert to cents
                currency: 'eur',
                product: priceId.split('_')[0], // Extract product ID
                active: true
            });

            // Deactivate old price
            await stripe.prices.update(priceId, { active: false });

            // Update environment variable (you may want to store this in a database)
            if (product === 'audiobook') {
                process.env.STRIPE_AUDIOBOOK_PRICE_ID = newPrice.id;
            } else if (product === 'signed-book') {
                process.env.STRIPE_SIGNED_BOOK_PRICE_ID = newPrice.id;
            }

            res.json({ success: true, newPriceId: newPrice.id });
        } else {
            res.status(400).json({ error: 'Invalid product' });
        }

    } catch (error) {
        console.error('Pricing update error:', error);
        res.status(500).json({ error: 'Failed to update pricing' });
    }
});

// Send Newsletter API
app.post('/api/send-newsletter', requireAuth, async (req, res) => {
    try {
        const { subject, content, recipients } = req.body;
        
        // Get subscriber list (implement based on your system)
        let subscriberList = [];
        if (recipients === 'all') {
            // Get all subscribers from your database
            subscriberList = ['test@example.com']; // Placeholder
        } else if (recipients === 'test') {
            subscriberList = ['aleks@aleksfilmore.com'];
        }

        // Send via Resend
        const emailPromises = subscriberList.map(email => 
            resend.emails.send({
                from: 'aleks@aleksfilmore.com',
                to: email,
                subject: subject,
                html: content
            })
        );

        await Promise.all(emailPromises);

        res.json({ 
            success: true, 
            sent: subscriberList.length,
            message: `Newsletter sent to ${subscriberList.length} subscribers`
        });

    } catch (error) {
        console.error('Newsletter send error:', error);
        res.status(500).json({ error: 'Failed to send newsletter' });
    }
});

// Blog Posts API (if you want to store in database instead of localStorage)
app.get('/api/blog-posts', requireAuth, (req, res) => {
    // Get from database or file system
    // For now, return empty array to use localStorage
    res.json([]);
});

app.post('/api/blog-posts', requireAuth, (req, res) => {
    // Save to database or file system
    const { title, slug, content, status } = req.body;
    
    // Implement your storage logic here
    
    res.json({ success: true, message: 'Post saved successfully' });
});

app.put('/api/blog-posts/:id', requireAuth, (req, res) => {
    // Update existing post
    const { id } = req.params;
    const { title, slug, content, status } = req.body;
    
    // Implement your update logic here
    
    res.json({ success: true, message: 'Post updated successfully' });
});

app.delete('/api/blog-posts/:id', requireAuth, (req, res) => {
    // Delete post
    const { id } = req.params;
    
    // Implement your delete logic here
    
    res.json({ success: true, message: 'Post deleted successfully' });
});

// Export functions for use in main server.js
module.exports = {
    requireAuth,
    // Add other functions as needed
};
