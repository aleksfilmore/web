const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const ng = spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: true });

function checkReady(retries = 0) {
  const opts = { hostname: '127.0.0.1', port: 8888, path: '/', method: 'GET', timeout: 2000 };
  const req = http.request(opts, res => {
    console.log('Netlify Dev ready (status ' + res.statusCode + '). Running smoke test...');
    // Run smoke test
    const smoke = spawn('npm', ['run', 'smoke'], { stdio: 'inherit', shell: true });
    smoke.on('exit', code => {
      console.log('Smoke test finished with code', code);
      // leave netlify running; exit this helper with smoke test code
      process.exit(code);
    });
  });
  req.on('error', err => {
    if (retries < 30) {
      setTimeout(() => checkReady(retries + 1), 1000);
    } else {
      console.error('Timed out waiting for Netlify Dev');
      process.exit(2);
    }
  });
  req.end();
}

checkReady();
