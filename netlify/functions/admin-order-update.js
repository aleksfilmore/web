const { requireAuth } = require('./utils/auth');
const { neon } = require('@netlify/neon');
const { drizzle } = require('drizzle-orm/neon-http');

// Minimal query helper without TypeScript schema to reduce friction in serverless
exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  const authError = requireAuth(event);
  if (authError) return authError;

  try {
    const body = JSON.parse(event.body || '{}');
    const { orderId, newStatus, note, tracking } = body;
    if (!orderId || !newStatus) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'orderId and newStatus are required' }) };
    }

    const client = neon();
    const db = drizzle({ client });

    // Persist status history
    await db.execute(`INSERT INTO order_status_history (order_id, from_status, to_status, note, changed_by) VALUES ($1,$2,$3,$4,$5)`, [orderId, '', newStatus, note || '', 'admin']);

    // Update orders table if exists
    await db.execute(`UPDATE orders SET status = $1, metadata = jsonb_set(coalesce(metadata, '{}'), '{tracking}', $2::jsonb, true) WHERE id = $3`, [newStatus, JSON.stringify({ tracking }), orderId]);

    // Optionally trigger Resend email via existing function endpoint (we can call it) - for now, return success and let frontend call resend if needed
    return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Order status updated' }) };

  } catch (error) {
    console.error('admin-order-update error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
