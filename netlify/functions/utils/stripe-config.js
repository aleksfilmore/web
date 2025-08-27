// Utility to load Stripe configuration
const path = require('path');

const getStripeConfig = () => {
    try {
        // Try environment variable first (for production flexibility)
        if (process.env.STRIPE_CONFIG) {
            return JSON.parse(process.env.STRIPE_CONFIG);
        }
        
        // Fall back to local file
        const configPath = path.join(__dirname, '../../data/stripe-config.json');
        return require(configPath);
    } catch (error) {
        console.warn('No Stripe config found, using environment variables');
        return null;
    }
};

// Get product ID with fallback to environment variable
const getProductId = (productType) => {
    const config = getStripeConfig();
    if (config && config.products && config.products[productType]) {
        return config.products[productType].id;
    }
    
    // Fallback to environment variables
    switch (productType) {
        case 'audiobook':
            return process.env.STRIPE_AUDIOBOOK_PRODUCT_ID;
        case 'signedBook':
            return process.env.STRIPE_SIGNED_BOOK_PRODUCT_ID;
        case 'bundle':
            return process.env.STRIPE_BUNDLE_PRODUCT_ID;
        default:
            return null;
    }
};

// Get price ID with fallback to environment variable
const getPriceId = (productType, isDiscount = false) => {
    const config = getStripeConfig();
    if (config && config.products && config.products[productType]) {
        const product = config.products[productType];
        if (isDiscount && product.discountPriceId) {
            return product.discountPriceId;
        }
        return product.priceId;
    }
    
    // Fallback to environment variables
    switch (productType) {
        case 'audiobook':
            return isDiscount ? process.env.STRIPE_AUDIOBOOK_DISCOUNT_PRICE_ID : process.env.STRIPE_AUDIOBOOK_PRICE_ID;
        case 'signedBook':
            return process.env.STRIPE_SIGNED_BOOK_PRICE_ID;
        case 'bundle':
            return process.env.STRIPE_BUNDLE_PRICE_ID;
        default:
            return null;
    }
};

module.exports = {
    getStripeConfig,
    getProductId,
    getPriceId
};
