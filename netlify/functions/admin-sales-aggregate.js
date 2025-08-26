// Server-side sales aggregation using Stripe directly.
// This enforces the same admin auth as other functions and queries Stripe for sessions
// that fall into the requested date range. It returns the same shape as before:
// { range, start, end, count, total }

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { requireAuth } = require('./utils/auth');

const ranges = {
  today: (now) => {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  },
  yesterday: (now) => {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { start, end };
  },
  last7: (now) => {
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    return { start, end };
  },
  thisMonth: (now) => {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end };
  },
  lastMonth: (now) => {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start, end };
  },
  last3months: (now) => {
    const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { start, end };
  }
};

function parseOrderDate(order) {
  // try common fields
  if (!order) return null;
  if (order.created_at) return new Date(order.created_at);
  if (order.createdAt) return new Date(order.createdAt);
  if (order.date) return new Date(order.date);
  if (order.timestamp) return new Date(order.timestamp);
  // fallback: attempt to parse id-like or metadata
  return null;
}

function sumOrders(orders, start, end) {
  const filtered = orders.filter(o => {
    const d = parseOrderDate(o);
    return d && d >= start && d < end;
  });
  const total = filtered.reduce((acc, o) => {
    const v = parseFloat((o.total || o.amount || o.price || 0));
    return acc + (isNaN(v) ? 0 : v);
  }, 0);
  return { count: filtered.length, total };
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };
  try {
    // Verify auth using shared util
    const authError = requireAuth(event);
    if (authError) return authError;

    // Read desired range from query or body
    const q = event.queryStringParameters || {};
    const body = event.body ? JSON.parse(event.body) : {};
    const rangeKey = (q.range || body.range || 'last7').toLowerCase();

    if (!ranges[rangeKey]) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown range' }) };
    }

    const now = new Date();
    const { start, end } = ranges[rangeKey](now);

    if (!process.env.STRIPE_SECRET_KEY) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfiguration: missing STRIPE_SECRET_KEY' }) };
    }

    // Query Stripe checkout.sessions in the time window. Use unix timestamps (seconds).
    const createdGte = Math.floor(start.getTime() / 1000);
    const createdLt = Math.floor(end.getTime() / 1000);

    let hasMore = true;
    let startingAfter = null;
    let count = 0;
    let total = 0;

    while (hasMore) {
      const params = {
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
        created: { gte: createdGte, lt: createdLt }
      };

      const res = await stripe.checkout.sessions.list(params);

      for (const session of res.data) {
        if (session.payment_status === 'paid') {
          // Stripe amounts are in cents
          const amt = (session.amount_total || 0) / 100;
          total += amt;
          count += 1;
        }
      }

      hasMore = res.has_more;
      if (hasMore && res.data.length) {
        startingAfter = res.data[res.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ range: rangeKey, start: start.toISOString(), end: end.toISOString(), count, total })
    };
  } catch (e) {
    console.error('admin-sales-aggregate error', e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
