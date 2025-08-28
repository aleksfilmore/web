const { requireAuth } = require('./utils/auth');
const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  // Require auth
  const authError = requireAuth(event);
  if (authError) return authError;

  try {
    const query = event.queryStringParameters || {};
    const perPage = Math.min(500, Math.max(1, parseInt(query.perPage || query.lines || '100', 10)));
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const filter = {
      orderId: query.orderId || null,
      actor: query.actor || null,
      startDate: query.startDate || null,
      endDate: query.endDate || null
    };

    const auditFile = path.join(__dirname, '..', '..', 'logs', 'order-update-audit.log');

    if (!fs.existsSync(auditFile)) {
      return { statusCode: 200, headers, body: JSON.stringify({ entries: [], count: 0, page, perPage }) };
    }

    // Stream-read file to avoid loading large files into memory
    const results = [];
    const rl = require('readline').createInterface({
      input: fs.createReadStream(auditFile, { encoding: 'utf8' }),
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (!line || !line.trim()) continue;
      let obj;
      try { obj = JSON.parse(line); } catch (e) { obj = { raw: line }; }

      // Apply filters
      if (filter.orderId && String(obj.orderId || obj.id || '').indexOf(filter.orderId) === -1) continue;
      if (filter.actor && String(obj.actor || obj.user || '').indexOf(filter.actor) === -1) continue;
      if (filter.startDate) {
        const ts = new Date(obj.ts || obj.time || null);
        if (isNaN(ts)) continue;
        if (ts < new Date(filter.startDate)) continue;
      }
      if (filter.endDate) {
        const ts = new Date(obj.ts || obj.time || null);
        if (isNaN(ts)) continue;
        if (ts > new Date(filter.endDate)) continue;
      }

      results.push(obj);
    }

    const total = results.length;
    const start = (page - 1) * perPage;
    const slice = results.slice(start, start + perPage);

    return { statusCode: 200, headers, body: JSON.stringify({ entries: slice, count: total, page, perPage }) };
  } catch (error) {
    console.error('admin-audit-log error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) };
  }
};
