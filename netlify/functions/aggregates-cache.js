const fs = require('fs');
const path = require('path');
const { requireAuth } = require('./utils/auth');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  // Optional auth: if Authorization provided, verify it. If absent, allow read (you can change this to require auth).
  try {
    if (event.headers && (event.headers.authorization || event.headers.Authorization)) {
      const authError = requireAuth(event);
      if (authError) return authError;
    }

    // Allow overriding the cache path via environment variable. If a directory is provided,
    // the code will look for `aggregates.json` inside that directory. Otherwise treat value as file path.
    let filePath = null;
    const envPath = process.env.NETLIFY_CACHE_PATH;
    if (envPath) {
      const resolved = path.isAbsolute(envPath) ? envPath : path.resolve(process.cwd(), envPath);
      try {
        const stat = fs.existsSync(resolved) && fs.statSync(resolved);
        if (stat && stat.isDirectory()) {
          filePath = path.join(resolved, 'aggregates.json');
        } else {
          filePath = resolved;
        }
      } catch (e) {
        filePath = resolved; // fallback to resolved path
      }
    } else {
      filePath = path.join(__dirname, '..', 'data', 'aggregates.json');
    }

    if (!fs.existsSync(filePath)) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: `Aggregates not found at ${filePath}. Run generate script.` }) };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return { statusCode: 200, headers, body: content };
  } catch (e) {
    console.error('aggregates-cache error', e);
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
