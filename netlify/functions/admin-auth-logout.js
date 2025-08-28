// Admin logout - clears session cookie but requires valid auth + CSRF
const { requireAuth, getCorsHeaders } = require('./utils/auth');

exports.handler = async (event) => {
    const headers = getCorsHeaders(event);

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    // Ensure request is authenticated and CSRF protected
    const authError = requireAuth(event);
    if (authError) return authError;

    // Overwrite cookie to expire immediately
    const cookieParts = [`admin_session=; Path=/; Max-Age=0; SameSite=Strict`];
    // In production, mark cookie Secure and HttpOnly
    if (process.env.NODE_ENV === 'production' || process.env.NETLIFY_ENV === 'production') {
        cookieParts.push('Secure', 'HttpOnly');
    }

    const responseHeaders = {
        ...headers,
        'Set-Cookie': cookieParts.join('; '),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
    };

    return {
        statusCode: 200,
        headers: responseHeaders,
        body: JSON.stringify({ success: true, message: 'Logged out' })
    };
};
