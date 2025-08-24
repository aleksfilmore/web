// Admin Auth Login - Issues a stateless HMAC signed token with rate limiting and CSRF
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Rate limiting storage (in production, use Redis or database)
const loginAttempts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || 'CHANGE_ME_DEV_SECRET';

function base64url(input) {
  return Buffer.from(JSON.stringify(input))
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function sign(data) {
  return crypto.createHmac('sha256', SECRET).update(data).digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function generateToken(ttlSec = 1800) { // 30 minutes
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iat: now, exp: now + ttlSec, scope: 'admin' };
  const h = base64url(header);
  const p = base64url(payload);
  const sig = sign(`${h}.${p}`);
  return `${h}.${p}.${sig}`;
}

function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

function checkRateLimit(clientIP) {
  const now = Date.now();
  
  if (loginAttempts.has(clientIP)) {
    const attempts = loginAttempts.get(clientIP);
    const recentAttempts = attempts.filter(time => now - time < RATE_LIMIT_WINDOW);
    
    if (recentAttempts.length >= MAX_ATTEMPTS) {
      return {
        blocked: true,
        retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - Math.min(...recentAttempts))) / 1000)
      };
    }
    
    loginAttempts.set(clientIP, recentAttempts);
    return { blocked: false };
  }
  
  return { blocked: false };
}

function recordFailedAttempt(clientIP) {
  const now = Date.now();
  const attempts = loginAttempts.get(clientIP) || [];
  attempts.push(now);
  loginAttempts.set(clientIP, attempts);
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Rate limiting check
  const clientIP = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
  const rateLimitCheck = checkRateLimit(clientIP);
  
  if (rateLimitCheck.blocked) {
    return {
      statusCode: 429,
      headers,
      body: JSON.stringify({ 
        error: 'Too many login attempts. Please try again later.',
        retryAfter: rateLimitCheck.retryAfter
      })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { password } = body;
    if (!password) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Password required' }) };
    }

    if (!ADMIN_PASSWORD_HASH) {
      return { statusCode: 503, headers, body: JSON.stringify({ error: 'Admin login disabled: ADMIN_PASSWORD_HASH not configured' }) };
    }
    
    // Use bcrypt to verify password against hash
    const valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    if (!valid) {
      // Record failed attempt for rate limiting
      recordFailedAttempt(clientIP);
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid credentials' }) };
    }

    // Generate tokens
    const ttlSec = 30 * 60; // 30 minutes
    const token = generateToken(ttlSec);
    const csrfToken = generateCSRFToken();
    
    // Set secure cookie (in production, this would be HttpOnly)
    const cookieOptions = [
      `admin_session=${token}`,
      'Path=/',
      'SameSite=Strict',
      // 'Secure', // Enable in production with HTTPS
      // 'HttpOnly', // Enable for production
      `Max-Age=${ttlSec}`
    ].join('; ');
    
    const responseHeaders = {
      ...headers,
      'Set-Cookie': cookieOptions
    };

    return { 
      statusCode: 200, 
      headers: responseHeaders, 
      body: JSON.stringify({ 
        token, 
        csrfToken,
        expiresIn: ttlSec,
        message: 'Login successful'
      }) 
    };
  } catch (e) {
    recordFailedAttempt(clientIP);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Auth failure', details: e.message }) };
  }
};

// No server state exported; token is stateless
