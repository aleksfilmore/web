const fs = require('fs');
const path = require('path');

// Load local .env so this script can run locally without extra env plumbing
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
} catch (e) {
  // ignore if dotenv not available in some environments
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// This script generates daily aggregates for the last 90 days and named ranges.
// It writes `data/aggregates.json` which is served by `netlify/functions/aggregates-cache.js`.

async function listPaidSessionsWithin(startTs, endTs) {
  let hasMore = true;
  let startingAfter = null;
  let total = 0;
  let count = 0;

  while (hasMore) {
    const params = {
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
      created: { gte: startTs, lt: endTs }
    };

    const res = await stripe.checkout.sessions.list(params);

    for (const session of res.data) {
      if (session.payment_status === 'paid') {
        total += (session.amount_total || 0) / 100;
        count += 1;
      }
    }

    hasMore = res.has_more;
    if (hasMore && res.data.length) {
      startingAfter = res.data[res.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  return { count, total };
}

function rangeFns() {
  return {
    today: (now) => {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { start, end };
    },
    last7: (now) => {
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      return { start, end };
    },
    thisMonth: (now) => {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start, end };
    },
    lastMonth: (now) => {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end };
    },
    last3months: (now) => {
      const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { start, end };
    }
  };
}

(async () => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY');
    }

    const now = new Date();
    const ranges = rangeFns();

    const named = {};
    for (const key of Object.keys(ranges)) {
      const { start, end } = ranges[key](now);
      const startTs = Math.floor(start.getTime() / 1000);
      const endTs = Math.floor(end.getTime() / 1000);
      console.log(`Computing ${key} from ${start.toISOString()} to ${end.toISOString()}`);
      const agg = await listPaidSessionsWithin(startTs, endTs);
      named[key] = { range: key, start: start.toISOString(), end: end.toISOString(), count: agg.count, total: agg.total };
    }

    // daily buckets for last 90 days
    const days = [];
    for (let i = 0; i < 90; i++) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      day.setDate(day.getDate() - i);
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const startTs = Math.floor(start.getTime() / 1000);
      const endTs = Math.floor(end.getTime() / 1000);
      const agg = await listPaidSessionsWithin(startTs, endTs);
      days.push({ date: start.toISOString().slice(0,10), start: start.toISOString(), end: end.toISOString(), count: agg.count, total: agg.total });
      console.log(`Day ${start.toISOString().slice(0,10)}: ${agg.count} / ${agg.total}`);
    }

    const out = { generated_at: new Date().toISOString(), named, days };

    const outDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'aggregates.json');
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log('Wrote', outPath);
  } catch (e) {
    console.error('generate-aggregates error', e);
    process.exit(1);
  }
})();
