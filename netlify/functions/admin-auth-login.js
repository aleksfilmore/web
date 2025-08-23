// Admin Auth Login - Issues a stateless HMAC signed token
const crypto = require('crypto');

const PASSWORDS = (process.env.ADMIN_PASSWORDS || 'aleksfilmore2024admin!,twbe_admin_secure_2024')
  .split(',')
  .map(p => p.trim())
  .filter(Boolean);
const SECRET = process.env.SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || 'CHANGE_ME_DEV_SECRET';

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

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { password } = body;
    if (!password) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Password required' }) };
    }

    const valid = PASSWORDS.includes(password);
    if (!valid) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Invalid credentials' }) };
    }

  const ttlSec = 30 * 60;
  const token = generateToken(ttlSec);
  return { statusCode: 200, headers, body: JSON.stringify({ token, expiresIn: ttlSec }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Auth failure', details: e.message }) };
  }
};

// No server state exported; token is stateless
