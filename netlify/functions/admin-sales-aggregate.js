const fetch = require('node-fetch');

// This function provides server-side aggregation of sales/orders by common date ranges.
// It expects the same auth as other admin functions (Authorization: Bearer <token>)
// If you want to hook into the existing admin-orders data source, it will call that function
// internally via the local dev endpoint when running under Netlify Dev, or you can swap to
// a DB call if available.

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
    // Read desired range from query or body
    const q = event.queryStringParameters || {};
    const body = event.body ? JSON.parse(event.body) : {};
    const rangeKey = (q.range || body.range || 'last7').toLowerCase();

    if (!ranges[rangeKey]) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown range' }) };
    }

    // Fetch orders using the local admin-orders function (so we reuse existing logic).
    // This requires Netlify Dev or production endpoint to be reachable.
    const base = (process.env.NETLIFY_DEV || process.env.NETLIFY_LOCAL) ? 'http://localhost:8888/.netlify/functions' : (process.env.SITE_URL || '');
    let orders = [];

    if (base) {
      try {
        const authHeader = event.headers && event.headers.authorization ? { Authorization: event.headers.authorization } : {};
        const res = await fetch(base + '/admin-orders', { headers: authHeader });
        if (res.ok) {
          orders = await res.json();
        } else {
          // fallback: try loading a local file or return error
          return { statusCode: 502, headers, body: JSON.stringify({ error: 'Failed to fetch orders', status: res.status }) };
        }
      } catch (e) {
        return { statusCode: 502, headers, body: JSON.stringify({ error: 'Error fetching orders', details: e.message }) };
      }
    }

    const now = new Date();
    const { start, end } = ranges[rangeKey](now);
    const agg = sumOrders(orders, start, end);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ range: rangeKey, start: start.toISOString(), end: end.toISOString(), count: agg.count, total: agg.total })
    };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
