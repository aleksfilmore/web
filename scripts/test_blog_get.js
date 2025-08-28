(async function(){
  try {
    const fn = require('../netlify/functions/blog-get');
    const ev = { queryStringParameters: { slug: 'anatomy-of-a-ghost' } };
    const res = await fn.handler(ev);
    console.log('STATUS', res.statusCode);
    try { console.log(JSON.stringify(JSON.parse(res.body), null, 2)); } catch(e) { console.log(res.body); }
  } catch (e) {
    console.error('ERROR', e && e.stack || e);
  }
})();
