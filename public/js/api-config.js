// Configuration for API endpoints
// Auto-detects environment (development vs production)

const API_CONFIG = {
    // Automatically use correct URL based on environment
    BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'https://aleksfilmore.com',
    
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
