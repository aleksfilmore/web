require('dotenv').config({ path: '.env' });
const { neon } = require('@netlify/neon');
(async () => {
  const client = neon();
  try {
    await client.transaction(async (txHelper) => {
      console.log('txHelper keys:', Object.keys(txHelper));
      for (const k of Object.keys(txHelper)) console.log(k, typeof txHelper[k]);
      // Return empty array to satisfy transaction signature
      return [];
    });
    console.log('transaction helper inspected');
  } catch (err) {
    console.error('transaction inspect failed:', err?.message || err);
  }
})();
