// Local handler smoke test - invokes handler functions directly to validate auth & CSRF
const bcrypt = require('bcryptjs');
const path = require('path');

(async function(){
  try {
    const PASSWORD = process.env.ADMIN_PASSWORD || 'Al3xandrescu1903?';

    // Ensure ADMIN_PASSWORD_HASH is set for the handler to validate against
    if (!process.env.ADMIN_PASSWORD_HASH) {
      const hash = bcrypt.hashSync(PASSWORD, 10);
      process.env.ADMIN_PASSWORD_HASH = hash;
      console.log('Set ADMIN_PASSWORD_HASH for local test');
    }

    // Load the login handler
  const loginModule = require(path.join(__dirname, '..', 'netlify', 'functions', 'admin-auth-login.js'));
  const loginHandler = loginModule.handler || loginModule.exports?.handler || loginModule.exports || loginModule;
    const authUtils = require(path.join(__dirname, '..', 'netlify', 'functions', 'utils', 'auth.js'));

    console.log('Calling admin-auth-login.handler...');
    const loginEvent = { httpMethod: 'POST', headers: {}, body: JSON.stringify({ password: PASSWORD }) };
  const loginRes = await (typeof loginHandler === 'function' ? loginHandler(loginEvent) : (loginHandler.handler ? loginHandler.handler(loginEvent) : null));

    console.log('Login response status:', loginRes.statusCode);
    const loginBody = JSON.parse(loginRes.body || '{}');
    console.log('Login body keys:', Object.keys(loginBody));

    if (!loginBody.token || !loginBody.csrfToken) {
      throw new Error('Login did not return token or csrfToken');
    }

    const token = loginBody.token;
    const csrf = loginBody.csrfToken;

    console.log('Invoking requireAuth with correct CSRF (should return null)');
    const goodEvent = { headers: { authorization: `Bearer ${token}`, 'x-csrf-token': csrf }, httpMethod: 'POST' };
    const goodAuth = authUtils.requireAuth(goodEvent);
    console.log('requireAuth result (null means OK):', goodAuth);
    if (goodAuth) throw new Error('requireAuth failed for valid token+csrf: ' + JSON.stringify(goodAuth));

    console.log('Invoking requireAuth without CSRF (should return error object)');
    const badEvent = { headers: { authorization: `Bearer ${token}` }, httpMethod: 'POST' };
    const badAuth = authUtils.requireAuth(badEvent);
    console.log('requireAuth result without CSRF:', badAuth && badAuth.statusCode ? `status ${badAuth.statusCode}` : JSON.stringify(badAuth));
    if (!badAuth || badAuth.statusCode !== 403) throw new Error('CSRF check did not fail as expected');

    console.log('Local handler smoke test passed.');
    process.exit(0);
  } catch (err) {
    console.error('Local handler smoke test failed:', err);
    process.exit(1);
  }
})();
