require('dotenv').config({ path: '.env' });

async function run() {
  try {
    const { neon } = require('@netlify/neon');
    const { drizzle } = require('drizzle-orm/neon-http');
    const client = neon();
    const db = drizzle({ client });

    console.log('Running test query: SELECT 1 as ok');
    const res = await db.execute('SELECT 1 as ok');
    console.log('Query result:', res);
  } catch (err) {
    console.error('DB test failed:', err?.message || err);
    if (err?.raw) console.error('Raw error:', err.raw);
    process.exit(1);
  }
}

run();
