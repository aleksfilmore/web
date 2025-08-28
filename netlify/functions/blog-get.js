const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function parseFrontMatter(content) {
  const fmRegex = /^---\s*\n([\s\S]*?)\n---\s*\n?/;
  const match = content.match(fmRegex);
  if (!match) return { attrs: {}, body: content };
  try {
    const attrs = yaml.load(match[1]) || {};
    const body = content.slice(match[0].length);
    return { attrs, body };
  } catch (e) {
    return { attrs: {}, body: content };
  }
}

exports.handler = async function(event) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  try {
    const slug = (event.queryStringParameters && event.queryStringParameters.slug) || (event.pathParameters && event.pathParameters.slug);
    if (!slug) return { statusCode: 400, headers, body: JSON.stringify({ error: 'slug required' }) };
    // prefer prebuilt JSON in data/blog-posts
    const prebuiltPath = path.join(__dirname, '..', '..', 'data', 'blog-posts', `${slug}.json`);
    if (fs.existsSync(prebuiltPath)) {
      const raw = fs.readFileSync(prebuiltPath, 'utf8');
      const parsed = JSON.parse(raw);
      return { statusCode: 200, headers, body: JSON.stringify(parsed) };
    }

    // fallback: parse original HTML (older deploys)
    const filePath = path.join(__dirname, '..', '..', 'blog', `${slug}.html`);
    if (!fs.existsSync(filePath)) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };

    const content = fs.readFileSync(filePath, 'utf8');
    const { attrs, body } = parseFrontMatter(content);
    const title = attrs.title || (body.match(/<h1[^>]*>([^<]+)<\/h1>/i) ? RegExp.$1 : slug.replace(/[-_]/g, ' '));
    const publishedAt = attrs.date || attrs.publishedAt || (body.match(/<time[^>]*datetime="([^"]+)"/i) ? RegExp.$1 : null);

    return { statusCode: 200, headers, body: JSON.stringify({ slug, title, publishedAt, tags: attrs.tags || [], content: body }) };
  } catch (e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
