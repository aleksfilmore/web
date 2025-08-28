const fetch = require('node-fetch');
const { requireAuth } = require('./utils/auth');

const ranges = {
  last7: (now) => {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    return { start, end };
  }
};

exports.handler = async (event) => {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  try {
    const authError = requireAuth(event);
    if (authError) return authError;

    const qs = event.queryStringParameters || {};
    const rangeKey = (qs.range || 'last7').toLowerCase();
    if (!ranges[rangeKey]) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown range' }) };

    // Try to fetch admin-orders endpoint locally to reuse filtering/pagination logic
    const base = (process.env.NETLIFY_DEV || process.env.NETLIFY_LOCAL) ? 'http://localhost:8888/.netlify/functions' : (process.env.SITE_URL || '');
    let orders = [];
    if (base) {
      try {
        const authHeader = event.headers && event.headers.authorization ? { Authorization: event.headers.authorization } : {};
        const res = await fetch(base + '/admin-orders', { headers: authHeader });
        if (res.ok) {
          const payload = await res.json();
          orders = payload.orders || [];
        }
      } catch (e) {
        // ignore and fall back to empty
      }
    }

    const now = new Date();
    const { start, end } = ranges[rangeKey](now);
    const filtered = orders.filter(o => {
      const d = o && (o.date || o.created_at || o.createdAt || o.timestamp);
      if (!d) return false;
      const dt = new Date(d);
      return dt >= start && dt < end;
    });

    const total = filtered.reduce((s, o) => s + (parseFloat(o.amount || o.total || 0) || 0), 0);
    return { statusCode: 200, headers, body: JSON.stringify({ range: rangeKey, count: filtered.length, total }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
