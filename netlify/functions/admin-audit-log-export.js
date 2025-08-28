const { requireAuth } = require('./utils/auth');
const fs = require('fs');
const path = require('path');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/x-ndjson'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: 'Method not allowed' };

  // Require auth
  const authError = requireAuth(event);
  if (authError) return authError;

  try {
    const query = event.queryStringParameters || {};
    const filter = {
      orderId: query.orderId || null,
      actor: query.actor || null,
      startDate: query.startDate || null,
      endDate: query.endDate || null
    };

    const auditFile = path.join(__dirname, '..', '..', 'logs', 'order-update-audit.log');
    if (!fs.existsSync(auditFile)) {
      return { statusCode: 200, headers, body: '' };
    }

    // Stream file and filter lines, return NDJSON body
    const input = fs.createReadStream(auditFile, { encoding: 'utf8' });
    const rl = require('readline').createInterface({ input, crlfDelay: Infinity });

    const chunks = [];
    for await (const line of rl) {
      if (!line || !line.trim()) continue;
      let obj;
      try { obj = JSON.parse(line); } catch (e) { obj = { raw: line }; }

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

      chunks.push(JSON.stringify(obj));
    }

    // Return concatenated NDJSON
    return { statusCode: 200, headers, body: chunks.join('\n') };
  } catch (error) {
    console.error('admin-audit-log-export error:', error);
    return { statusCode: 500, headers, body: 'Export error' };
  }
};
