// Simulate a Stripe checkout.session.completed webhook by calling the handler function directly.
require('dotenv').config({ path: '.env' });

(async () => {
  try {
    const webhook = require('../netlify/functions/webhook.js');

    // Build a fake session object similar to Stripe's session object
    const fakeSession = {
      id: 'cs_test_simulated_12345',
      payment_status: 'paid',
      amount_total: 1599,
      currency: 'usd',
      customer_email: 'sim-test@example.com',
      metadata: {
        product: 'signed_book',
        custom_note: 'Please sign to: Jamie'
      }
    };

    console.log('Invoking handleCheckoutSessionCompleted with fake session:', fakeSession.id);

    if (typeof webhook.handleCheckoutSessionCompleted === 'function') {
      await webhook.handleCheckoutSessionCompleted(fakeSession);
      console.log('handleCheckoutSessionCompleted completed');
    } else {
      console.error('handleCheckoutSessionCompleted is not exported from webhook module');
      process.exit(2);
    }

    // Print tail of audit log
    const fs = require('fs');
    const path = require('path');
    const logsDir = path.join(__dirname, '..', 'logs');
    const auditFile = path.join(logsDir, 'order-ingest-audit.log');
    if (fs.existsSync(auditFile)) {
      const data = fs.readFileSync(auditFile, 'utf8').split('\n').filter(Boolean);
      console.log('Last audit entry:', data[data.length - 1]);
    } else {
      console.warn('Audit file not found at', auditFile);
    }

  } catch (err) {
    console.error('Simulation failed:', err);
    process.exit(1);
  }
})();
