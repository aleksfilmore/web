require('dotenv').config({ path: '.env' });
const { neon } = require('@netlify/neon');

(async () => {
  try {
    const client = neon();
    console.log('Neon client keys:', Object.keys(client));
    for (const k of Object.keys(client)) {
      console.log(k, '=>', typeof client[k]);
    }
    // if fetch exists, try a simple fetch call
    if (typeof client.fetch === 'function') {
      console.log('client.fetch exists');
    }
    if (typeof client.query === 'function') {
      console.log('client.query exists');
    }
  } catch (err) {
    console.error('Failed to inspect neon client:', err);
  }
})();
