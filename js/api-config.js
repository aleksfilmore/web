// Configuration for API endpoints
// Updated with actual Railway URL

const API_CONFIG = {
    // Your Railway deployment URL
    BASE_URL: 'https://dynamic-blessing-production-8be8.up.railway.app',
    
    ENDPOINTS: {
        CONFIG: '/api/config',
        PRODUCTS: '/api/products',
        CREATE_CHECKOUT: '/api/create-checkout-session',
        VERIFY_ACCESS: '/api/verify-access'
    }
};

// Helper function to get full API URL
function getApiUrl(endpoint) {
    return API_CONFIG.BASE_URL + API_CONFIG.ENDPOINTS[endpoint];
}

// Export for use in other files
window.API_CONFIG = API_CONFIG;
window.getApiUrl = getApiUrl;
