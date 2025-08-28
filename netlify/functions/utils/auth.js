// Shared Authentication Utility for Admin Functions
const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || 'CHANGE_ME_DEV_SECRET';

function getCorsHeaders(event) {
    // Prefer the explicit Origin header to support credentials; fall back to Referer or default to '*'
    const headers = (event && event.headers) || {};
    const origin = headers.origin || headers.Origin || headers.referer || headers.Referer || '*';
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
        'Access-Control-Allow-Credentials': 'true',
        'Content-Type': 'application/json'
    };
}

function verifyToken(token) {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, error: 'Malformed token' };
    const [h, p, sig] = parts;
    const expected = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64')
        .replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
    if (sig !== expected) return { valid: false, error: 'Bad signature' };
    try {
        const payload = JSON.parse(Buffer.from(p.replace(/-/g,'+').replace(/_/g,'/'), 'base64').toString());
        if (payload.exp && Math.floor(Date.now()/1000) > payload.exp) {
            return { valid: false, error: 'Expired' };
        }
        if (payload.scope !== 'admin') return { valid: false, error: 'Invalid scope' };
        return { valid: true, payload };
    } catch (e) {
        return { valid: false, error: 'Payload parse error' };
    }
}

function extractToken(event) {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    const cookies = event.headers.cookie;
    if (cookies) {
        const sessionMatch = cookies.match(/admin_session=([^;]+)/);
        if (sessionMatch) {
            return sessionMatch[1];
        }
    }
    return null;
}

function requireAuth(event) {
    const token = extractToken(event);
    if (!token) {
        return {
            statusCode: 401,
            headers: getCorsHeaders(event),
            body: JSON.stringify({ error: 'Authentication required' })
        };
    }

    const authResult = verifyToken(token);
    if (!authResult.valid) {
        return {
            statusCode: 401,
            headers: getCorsHeaders(event),
            body: JSON.stringify({ error: 'Invalid token', details: authResult.error })
        };
    }

    // Attach parsed payload to event for downstream handlers
    try { event.__auth = authResult.payload; } catch (e) { /* ignore */ }

    // For state-changing requests, validate CSRF token
    try {
        const method = (event.httpMethod || event.method || 'GET').toUpperCase();
        if (method !== 'GET' && method !== 'OPTIONS') {
            const csrfHeader = event.headers['x-csrf-token'] || event.headers['X-CSRF-Token'];
            const expected = authResult.payload?.csrf;
            if (!csrfHeader || !expected || csrfHeader !== expected) {
                return {
                    statusCode: 403,
                    headers: getCorsHeaders(event),
                    body: JSON.stringify({ error: 'CSRF validation failed' })
                };
            }
        }
    } catch (e) {
        // If any error, deny
        return {
            statusCode: 403,
            headers: getCorsHeaders(event),
            body: JSON.stringify({ error: 'CSRF validation error' })
        };
    }

    return null; // Auth successful
}

module.exports = {
    verifyToken,
    extractToken,
    requireAuth
};
