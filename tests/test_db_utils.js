const { normalizeRows } = require('../netlify/functions/utils/db-utils');

function assertEqual(a,b, msg) {
  const as = JSON.stringify(a);
  const bs = JSON.stringify(b);
  if (as !== bs) throw new Error(msg || `Assertion failed: ${as} !== ${bs}`);
}

function run() {
  // pg-style rows
  const r1 = { rows: [{ id: '1', customer_email: 'a@a.com' }] };
  assertEqual(normalizeRows(r1)[0].id, '1', 'pg-style rows');

  // direct array
  const r2 = [{ id: '2', customer_email: 'b@b.com' }];
  assertEqual(normalizeRows(r2)[0].id, '2', 'direct array');

  // transaction style [{ rows: [...] }]
  const r3 = [{ rows: [{ id: '3' }] }];
  assertEqual(normalizeRows(r3)[0].id, '3', 'transaction rows');

  // numeric-key wrapper
  const r4 = [{ '0': { id: '4' } }];
  assertEqual(normalizeRows(r4)[0].id, '4', 'numeric-key wrapper');

  // nested arrays
  const r5 = [[{ id: '5' }]];
  assertEqual(normalizeRows(r5)[0].id, '5', 'nested arrays');

  console.log('All db-utils.normalizeRows tests passed');
}

run();
