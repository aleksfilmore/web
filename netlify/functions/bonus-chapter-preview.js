const fs = require('fs');
const path = require('path');
const { requireAuth } = require('./utils/auth');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  const authError = requireAuth(event);
  if (authError) return authError;

  try {
    const recipientsPath = path.join(__dirname, '../../data/bonus-chapter-recipients.json');
    const statsPath = path.join(__dirname, '../../data/bonus-chapter-stats.json');

    let recipients = [];
    if (fs.existsSync(recipientsPath)) {
      try { recipients = JSON.parse(fs.readFileSync(recipientsPath, 'utf8')); } catch (e) { recipients = []; }
    }

    let stats = { bonusChaptersSent: 0, bonusChaptersFailed: 0, lastUpdated: null };
    if (fs.existsSync(statsPath)) {
      try { stats = JSON.parse(fs.readFileSync(statsPath, 'utf8')); } catch (e) { /* ignore */ }
    }

  // Provide a small sample of recipient emails for admin preview (first 20)
  const sample = (Array.isArray(recipients) ? recipients.slice(0, 20).map(r => (r && r.email) ? r.email : (typeof r === 'string' ? r : '')) : []);
  return { statusCode: 200, headers, body: JSON.stringify({ recipientsCount: recipients.length, recentStats: stats, recipientsSample: sample }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error', details: e.message }) };
  }
};
