// Alias to the existing admin-auth-login handler so older clients can call /admin-login
const auth = require('./admin-auth-login');
exports.handler = auth.handler;
