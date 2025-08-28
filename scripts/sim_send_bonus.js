require('dotenv').config({ path: '.env' });
const crypto = require('crypto');
const SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || 'CHANGE_ME_DEV_SECRET';
const payload = { scope: 'admin', exp: Math.floor(Date.now()/1000) + 3600, csrf: 'test-csrf' };
const p = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const sig = crypto.createHmac('sha256', SECRET).update(`${header}.${p}`).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
const token = `${header}.${p}.${sig}`;

(async () => {
  try {
    const fn = require('../netlify/functions/send-bonus-chapter.js');
  const event = { httpMethod: 'POST', headers: { Authorization: 'Bearer ' + token, 'X-CSRF-Token': 'test-csrf' }, body: '{}' };
    const res = await fn.handler(event, {});
    console.log('status', res.statusCode);
    try { console.log('body', JSON.parse(res.body)); } catch (e) { console.log('body', res.body); }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
