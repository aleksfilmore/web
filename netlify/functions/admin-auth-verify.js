// Admin Auth Verify - Validates stateless HMAC token
const crypto = require('crypto');
const SECRET = process.env.SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || 'CHANGE_ME_DEV_SECRET';

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

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const auth = event.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.substring(7) : null;
    if (!token) {
      return { statusCode: 401, headers, body: JSON.stringify({ valid: false, error: 'Missing token' }) };
    }

    const result = verify(token);
    if (!result.valid) {
      return { statusCode: 401, headers, body: JSON.stringify(result) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ valid: true, exp: result.payload.exp }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ valid: false, error: e.message }) };
  }
};
