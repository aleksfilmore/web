const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class StripeAnalyticsService {
    constructor() {
        this.initialized = !!process.env.STRIPE_SECRET_KEY;
        if (!this.initialized) {
            console.warn('Stripe secret key not found. Stripe analytics will use mock data.');
        }
    }

    async getRevenueAnalytics(daysBack = 30) {
        if (!this.initialized) {
            return this.getMockRevenueData();
        }

        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysBack);

            // Get payment intents from the last X days
            const paymentIntents = await stripe.paymentIntents.list({
                created: {
                    gte: Math.floor(startDate.getTime() / 1000),
                    lt: Math.floor(endDate.getTime() / 1000)
                },
                limit: 100
            });

            // Get charges for more detailed info
            const charges = await stripe.charges.list({
                created: {
                    gte: Math.floor(startDate.getTime() / 1000),
                    lt: Math.floor(endDate.getTime() / 1000)
                },
                limit: 100
            });

            return this.processRevenueData(paymentIntents.data, charges.data);

        } catch (error) {
            console.error('Error fetching Stripe revenue analytics:', error.message);
            return this.getMockRevenueData();
        }
    }

    async getProductAnalytics(daysBack = 30) {
        if (!this.initialized) {
            return this.getMockProductData();
        }

        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysBack);

            // Get checkout sessions to see what products were purchased
            const sessions = await stripe.checkout.sessions.list({
                created: {
                    gte: Math.floor(startDate.getTime() / 1000),
                    lt: Math.floor(endDate.getTime() / 1000)
                },
                limit: 100
            });

            return this.processProductData(sessions.data);

        } catch (error) {
            console.error('Error fetching Stripe product analytics:', error.message);
            return this.getMockProductData();
        }
    }

    async getRecentOrders(limit = 10) {
        if (!this.initialized) {
            return this.getMockRecentOrders();
        }

        try {
            // Get recent successful payment intents
            const paymentIntents = await stripe.paymentIntents.list({
                limit: limit,
                status: 'succeeded'
            });

            const orders = [];
            
            for (const intent of paymentIntents.data) {
                try {
                    // Try to get the checkout session for more details
                    const sessions = await stripe.checkout.sessions.list({
                        payment_intent: intent.id,
                        limit: 1
                    });

                    const session = sessions.data[0];
                    let productInfo = 'Unknown Product';
                    
                    if (session?.metadata?.cart_items) {
                        try {
                            const items = JSON.parse(session.metadata.cart_items);
                            productInfo = items.map(item => this.getProductName(item.id)).join(', ');
                        } catch (e) {
                            console.warn('Failed to parse cart items for session:', session.id);
                        }
                    }

                    orders.push({
                        id: intent.id,
                        amount: intent.amount / 100, // Convert from cents
                        currency: intent.currency,
                        customer_email: intent.receipt_email || session?.customer_details?.email || 'Unknown',
                        created: new Date(intent.created * 1000),
                        product: productInfo,
                        status: intent.status
                    });
                } catch (sessionError) {
                    // If we can't get session details, just use basic payment intent info
                    orders.push({
                        id: intent.id,
                        amount: intent.amount / 100,
                        currency: intent.currency,
                        customer_email: intent.receipt_email || 'Unknown',
                        created: new Date(intent.created * 1000),
                        product: 'Unknown Product',
                        status: intent.status
                    });
                }
            }

            return orders;

        } catch (error) {
            console.error('Error fetching recent orders:', error.message);
            return this.getMockRecentOrders();
        }
    }

    async getCustomerAnalytics(daysBack = 30) {
        if (!this.initialized) {
            return this.getMockCustomerData();
        }

        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysBack);

            // Get customers created in the period
            const customers = await stripe.customers.list({
                created: {
                    gte: Math.floor(startDate.getTime() / 1000),
                    lt: Math.floor(endDate.getTime() / 1000)
                },
                limit: 100
            });

            return {
                newCustomers: customers.data.length,
                totalCustomers: await this.getTotalCustomerCount(),
                customerGrowth: this.calculateGrowth(customers.data)
            };

        } catch (error) {
            console.error('Error fetching customer analytics:', error.message);
            return this.getMockCustomerData();
        }
    }

    async getTotalCustomerCount() {
        try {
            // Get all customers (this might need pagination for large datasets)
            const customers = await stripe.customers.list({ limit: 100 });
            return customers.data.length;
        } catch (error) {
            console.warn('Could not get total customer count:', error.message);
            return 0;
        }
    }

    processRevenueData(paymentIntents, charges) {
        let totalRevenue = 0;
        let audiobookRevenue = 0;
        let bookRevenue = 0;
        let bundleRevenue = 0;
        
        const dailyRevenue = new Map();
        const today = new Date();
        
        // Initialize daily revenue for the last 30 days
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dailyRevenue.set(dateStr, 0);
        }

        paymentIntents.forEach(intent => {
            if (intent.status === 'succeeded') {
                const amount = intent.amount / 100; // Convert from cents
                totalRevenue += amount;
                
                // Add to daily revenue
                const date = new Date(intent.created * 1000).toISOString().split('T')[0];
                if (dailyRevenue.has(date)) {
                    dailyRevenue.set(date, dailyRevenue.get(date) + amount);
                }

                // Try to categorize by product (this is approximate without more metadata)
                if (amount <= 10) {
                    audiobookRevenue += amount;
                } else if (amount >= 20) {
                    bundleRevenue += amount;
                } else {
                    bookRevenue += amount;
                }
            }
        });

        // Convert daily revenue to chart format
        const chartData = Array.from(dailyRevenue.entries()).map(([date, revenue]) => ({
            date,
            revenue
        }));

        return {
            totalRevenue,
            audiobookRevenue,
            bookRevenue,
            bundleRevenue,
            chartData,
            transactionCount: paymentIntents.filter(p => p.status === 'succeeded').length
        };
    }

    processProductData(sessions) {
        const productCounts = {
            audiobook: 0,
            'signed-book': 0,
            bundle: 0
        };

        const productRevenue = {
            audiobook: 0,
            'signed-book': 0,
            bundle: 0
        };

        sessions.forEach(session => {
            if (session.payment_status === 'paid' && session.metadata?.cart_items) {
                try {
                    const items = JSON.parse(session.metadata.cart_items);
                    items.forEach(item => {
                        if (productCounts.hasOwnProperty(item.id)) {
                            productCounts[item.id] += item.quantity || 1;
                            productRevenue[item.id] += this.getProductPrice(item.id) * (item.quantity || 1);
                        }
                    });
                } catch (e) {
                    console.warn('Failed to parse cart items for session:', session.id);
                }
            }
        });

        return {
            counts: productCounts,
            revenue: productRevenue
        };
    }

    calculateGrowth(customers) {
        // Simple growth calculation based on creation dates
        const thisWeek = customers.filter(c => {
            const created = new Date(c.created * 1000);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return created >= weekAgo;
        });

        const lastWeek = customers.filter(c => {
            const created = new Date(c.created * 1000);
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return created >= twoWeeksAgo && created < weekAgo;
        });

        if (lastWeek.length === 0) return 0;
        return ((thisWeek.length - lastWeek.length) / lastWeek.length) * 100;
    }

    getProductName(productId) {
        const names = {
            'audiobook': 'Audiobook',
            'signed-book': 'Signed Paperback',
            'bundle': 'Complete Bundle'
        };
        return names[productId] || productId;
    }

    getProductPrice(productId) {
        const prices = {
            'audiobook': 7.99,
            'signed-book': 17.99,
            'bundle': 22.99
        };
        return prices[productId] || 0;
    }

    getMockRevenueData() {
        const chartData = [];
        const today = new Date();
        let totalRevenue = 0;
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const revenue = Math.random() * 500 + 100;
            totalRevenue += revenue;
            
            chartData.push({
                date: date.toISOString().split('T')[0],
                revenue: Math.round(revenue * 100) / 100
            });
        }

        return {
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            audiobookRevenue: Math.round(totalRevenue * 0.6 * 100) / 100,
            bookRevenue: Math.round(totalRevenue * 0.25 * 100) / 100,
            bundleRevenue: Math.round(totalRevenue * 0.15 * 100) / 100,
            chartData,
            transactionCount: Math.floor(Math.random() * 50) + 20
        };
    }

    getMockProductData() {
        return {
            counts: {
                audiobook: Math.floor(Math.random() * 100) + 50,
                'signed-book': Math.floor(Math.random() * 50) + 20,
                bundle: Math.floor(Math.random() * 30) + 10
            },
            revenue: {
                audiobook: Math.random() * 2000 + 1000,
                'signed-book': Math.random() * 1500 + 500,
                bundle: Math.random() * 1000 + 300
            }
        };
    }

    getMockRecentOrders() {
        const orders = [];
        const products = ['Audiobook', 'Signed Paperback', 'Complete Bundle'];
        const emails = ['customer1@example.com', 'customer2@example.com', 'customer3@example.com'];
        
        for (let i = 0; i < 10; i++) {
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));
            
            orders.push({
                id: `pi_mock_${Date.now()}_${i}`,
                amount: Math.round((Math.random() * 20 + 5) * 100) / 100,
                currency: 'usd',
                customer_email: emails[Math.floor(Math.random() * emails.length)],
                created: date,
                product: products[Math.floor(Math.random() * products.length)],
                status: 'succeeded'
            });
        }
        
        return orders.sort((a, b) => b.created - a.created);
    }

    getMockCustomerData() {
        return {
            newCustomers: Math.floor(Math.random() * 20) + 5,
            totalCustomers: Math.floor(Math.random() * 200) + 100,
            customerGrowth: Math.round((Math.random() * 40 - 20) * 100) / 100 // -20% to +20%
        };
    }

    async testConnection() {
        try {
            if (!this.initialized) {
                return {
                    success: false,
                    error: 'Stripe secret key not configured'
                };
            }

            // Test by getting account info
            const account = await stripe.accounts.retrieve();
            
            return {
                success: true,
                message: 'Stripe connection successful',
                data: {
                    country: account.country,
                    currency: account.default_currency,
                    email: account.email
                }
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = StripeAnalyticsService;
