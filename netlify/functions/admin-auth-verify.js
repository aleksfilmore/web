// Admin Auth Verify - Validates stateless HMAC token with enhanced security
const crypto = require('crypto');
const SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || 'CHANGE_ME_DEV_SECRET';

function verify(token) {
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

function extractTokenFromRequest(event) {
  // Try Authorization header first
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Try cookie (for enhanced security)
  const cookies = event.headers.cookie;
  if (cookies) {
    const sessionMatch = cookies.match(/admin_session=([^;]+)/);
    if (sessionMatch) {
      return sessionMatch[1];
    }
  }
  
  return null;
}

function validateCSRF(event) {
  // For state-changing operations, validate CSRF token
  if (event.httpMethod === 'GET') return true; // GET requests don't need CSRF
  
  const csrfHeader = event.headers['x-csrf-token'] || event.headers['X-CSRF-Token'];
  const csrfBody = event.body ? JSON.parse(event.body).csrfToken : null;
  
  // In a real implementation, you'd verify the CSRF token against a server-side store
  // For now, we'll accept any non-empty CSRF token for non-GET requests
  return !!(csrfHeader || csrfBody);
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    // Extract token from multiple sources
    const token = extractTokenFromRequest(event);
    if (!token) {
      return { statusCode: 401, headers, body: JSON.stringify({ valid: false, error: 'Missing token' }) };
    }

    // Verify token
    const result = verify(token);
    if (!result.valid) {
      return { statusCode: 401, headers, body: JSON.stringify(result) };
    }

    // Check CSRF for non-GET requests (though this endpoint is GET-only)
    if (!validateCSRF(event)) {
      return { statusCode: 403, headers, body: JSON.stringify({ valid: false, error: 'CSRF validation failed' }) };
    }

    // Add security headers
    const secureHeaders = {
      ...headers,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block'
    };

    return { 
      statusCode: 200, 
      headers: secureHeaders, 
      body: JSON.stringify({ 
        valid: true, 
        exp: result.payload.exp,
        timeToExpiry: result.payload.exp - Math.floor(Date.now() / 1000)
      }) 
    };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ valid: false, error: e.message }) };
  }
};
