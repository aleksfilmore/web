const fs = require('fs');
const path = require('path');
const { requireAuth } = require('./utils/auth');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  const authError = requireAuth(event);
  if (authError) return authError;

  try {
    const email = (event.queryStringParameters?.email || '').toLowerCase();
    if (!email) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing email param' }) };
    const file = path.join(__dirname, '../../data/bonus-chapter-recipients.json');
    let recipients = [];
    if (fs.existsSync(file)) {
      try { recipients = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
    }
    const found = recipients.find(r => r.email === email);
    return { statusCode: 200, headers, body: JSON.stringify({ email, received: !!found, sentAt: found?.sentAt || null }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error', details: e.message }) };
  }
};