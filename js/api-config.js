// Configuration for API endpoints
// Updated to use local server

const API_CONFIG = {
    // Local development server URL
    BASE_URL: 'http://localhost:3000',
    
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
