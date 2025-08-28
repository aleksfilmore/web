(async ()=>{
  try {
    console.log('Requiring create-checkout-session...');
    const createSession = require('./netlify/functions/create-checkout-session.js');
    console.log('Requiring webhook handler...');
    const webhook = require('./netlify/functions/webhook.js');

    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({ product: 'audiobook', email: 'test@example.com', customNote: 'Please sign this' }),
      headers: {},
      isBase64Encoded: false
    };

    console.log('Invoking create-checkout-session.handler...');
    const res = await createSession.handler(event, {});
    console.log('create-checkout-session response:');
    console.log(JSON.stringify(res, null, 2));

    console.log('Webhook module loaded OK.');
  } catch (err) {
    console.error('Error during test invoke:', err);
    process.exit(1);
  }
})();
