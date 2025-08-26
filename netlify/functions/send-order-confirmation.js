const fetch = require('node-fetch');

// Simple stub for sending an order confirmation email
// Expects POST { orderId }

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    const auth = (event.headers && (event.headers.authorization || event.headers.Authorization)) || '';
    if (!auth && process.env.NETLIFY_DEV !== 'true') return { statusCode: 401, body: 'Unauthorized' };

    const payload = JSON.parse(event.body || '{}');
    const orderId = payload.orderId;
    if (!orderId) return { statusCode: 400, body: JSON.stringify({ error: 'orderId required' }) };

    // Simulate sending an email. In production replace with actual mailer (nodemailer/resend)
    console.log('send-order-confirmation: sending confirmation for order', orderId);

    // Return success with a message id
    const messageId = `msg_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    return { statusCode: 200, body: JSON.stringify({ ok: true, messageId }) };

  } catch (e) {
    console.error('send-order-confirmation error', e);
    return { statusCode: 500, body: JSON.stringify({ error: 'internal' }) };
  }
};
