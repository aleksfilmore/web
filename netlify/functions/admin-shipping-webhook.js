const { requireAuth } = require('./utils/auth');
const fetch = require('node-fetch');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  const authErr = requireAuth(event);
  if (authErr) return authErr;

  try {
    const body = JSON.parse(event.body || '{}');
    const { orderId, to, products, buyerNote } = body;
    if (!orderId || !to) return { statusCode: 400, headers, body: JSON.stringify({ error: 'orderId and to are required' }) };

    const webhook = process.env.SHIPPING_WEBHOOK_URL;
    if (!webhook) return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'No webhook configured' }) };

    // Forward payload to configured webhook
    const resp = await fetch(webhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, to, products, buyerNote }) });
    const text = await resp.text();
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, status: resp.status, response: text }) };
  } catch (e) {
    console.error('shipping webhook error', e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
