// Shared DB helpers: NeonQuery shim, runQuery (multi-api), and normalizeRows
function buildNeonQuery(sql, params) {
  const q = {};
  try { Object.defineProperty(q, Symbol.toStringTag, { value: 'NeonQueryPromise' }); } catch (e) {}
  q.parameterizedQuery = { query: sql, params };
  return q;
}

async function runQuery(client, db, sql, params) {
  // Try db.query
  if (db && typeof db.query === 'function') return await db.query(sql, params);
  // client.query
  if (client && typeof client.query === 'function') return await client.query(sql, params);
  // transaction shim
  if (client && typeof client.transaction === 'function') {
    const neonQ = buildNeonQuery(sql, params);
    return await client.transaction([neonQ]);
  }
  // db.execute
  if (db && typeof db.execute === 'function') return await db.execute(sql, params);

  throw new Error('No supported DB query method available');
}

function normalizeRows(rowsRes) {
  if (!rowsRes) return [];

  let dataRows = [];
  if (Array.isArray(rowsRes)) {
    if (rowsRes.length === 1 && rowsRes[0] && Array.isArray(rowsRes[0].rows)) {
      dataRows = rowsRes[0].rows;
    } else if (rowsRes.length && rowsRes[0] && typeof rowsRes[0] === 'object' && 'rows' in rowsRes[0] && Array.isArray(rowsRes[0].rows)) {
      dataRows = rowsRes[0].rows;
    } else if (rowsRes.length && typeof rowsRes[0] === 'object' && !('rows' in rowsRes[0])) {
      dataRows = rowsRes;
    } else {
      dataRows = rowsRes.flat ? rowsRes.flat() : rowsRes;
    }
  } else if (rowsRes.rows && Array.isArray(rowsRes.rows)) {
    dataRows = rowsRes.rows;
  } else if (rowsRes.length && Array.isArray(rowsRes)) {
    dataRows = rowsRes;
  } else {
    dataRows = [];
  }

  // Normalize individual row wrappers like { '0': {...} } or [ {...} ] elements
  return dataRows.map(raw => {
    let r = raw;
    try {
      if (Array.isArray(r) && r.length) r = r[0];
      if (r && typeof r === 'object' && !Array.isArray(r) && Object.keys(r).length === 1 && ('0' in r || 0 in r)) {
        r = r['0'] || r[0];
      }
      if (r && typeof r === 'object' && 'rows' in r && Array.isArray(r.rows)) {
        r = r.rows[0] || r;
      }
    } catch (e) {
      // ignore
    }
    return r;
  });
}

module.exports = { buildNeonQuery, runQuery, normalizeRows };