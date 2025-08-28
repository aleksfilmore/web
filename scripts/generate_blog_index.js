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

function extractArticleHTML(fullHtml) {
  // Prefer <article>, then div.prose, then <main>, then body content
  const tryRegex = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class=["'][^"']*prose[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<body[^>]*>([\s\S]*?)<\/body>/i
  ];
  for (const rx of tryRegex) {
    const m = fullHtml.match(rx);
    if (m && m[1] && m[1].trim()) return m[1].trim();
  }
  // Fallback: return the original content (may be just fragment already)
  return fullHtml;
}

function stripScriptsAndStyles(html) {
  return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
             .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
             .replace(/<!--([\s\S]*?)-->/g, '');
}

function htmlToText(html) {
  let t = html.replace(/<[^>]+>/g, ' ');
  // decode a few common HTML entities
  t = t.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  // collapse whitespace
  t = t.replace(/\s+/g, ' ').trim();
  return t;
}

function firstParagraphText(html) {
  // try to find first <p> inside html
  const p = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  if (p && p[1]) return htmlToText(p[1]);
  // otherwise return first 1-2 sentences from cleaned text
  const txt = htmlToText(html);
  if (!txt) return '';
  const m = txt.match(/(^.{80,240}?\.)(\s|$)/);
  if (m) return m[1].trim();
  return txt.slice(0, 200).trim();
}

function estimateReadTime(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function generate() {
  const blogDir = path.join(__dirname, '..', 'blog');
  const outDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const postsOutDir = path.join(outDir, 'blog-posts');
  if (!fs.existsSync(postsOutDir)) fs.mkdirSync(postsOutDir, { recursive: true });

  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.html'));
  const posts = files.map(filename => {
    const filePath = path.join(blogDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    const { attrs, body } = parseFrontMatter(content);
    const slug = filename.replace(/\.html?$/i, '');
  const title = attrs.title || (attrs.heading) || (body.match(/<h1[^>]*>([^<]+)<\/h1>/i) ? RegExp.$1 : slug.replace(/[-_]/g, ' '));
  // Robust publishedAt extraction: prefer front-matter keys, then <time datetime>, JSON-LD, meta tags
  function coerceDateToISO(v) {
    if (!v) return null;
    // If it's already a Date object from yaml, convert
    if (v instanceof Date && !isNaN(v)) return v.toISOString();
    // Try to parse strings
    const d = new Date(String(v));
    if (!isNaN(d.getTime())) return d.toISOString();
    return null;
  }

  let publishedAt = null;
  const fmDateKeys = ['date', 'publishedAt', 'published', 'datePublished', 'created', 'createdAt'];
  for (const k of fmDateKeys) {
    if (attrs[k]) {
      publishedAt = coerceDateToISO(attrs[k]);
      if (publishedAt) break;
    }
  }

  // If front-matter didn't provide a usable date, search the HTML for <time datetime="..."> or variants
  if (!publishedAt) {
    const timeMatch = body.match(/<time[^>]*datetime=["']?([^"'\s>]+)["']?/i);
    if (timeMatch && timeMatch[1]) publishedAt = coerceDateToISO(timeMatch[1]);
  }

  // Look for JSON-LD with datePublished
  if (!publishedAt) {
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/ig;
    let m;
    while ((m = jsonLdRegex.exec(body)) !== null) {
      try {
        const obj = JSON.parse(m[1]);
        // obj may be an array or object, or @graph
        const candidates = [];
        if (Array.isArray(obj)) candidates.push(...obj);
        else candidates.push(obj);
        if (obj && obj['@graph']) candidates.push(...obj['@graph']);
        for (const c of candidates) {
          if (c && (c.datePublished || c.date || c.dateCreated || c.published)) {
            publishedAt = coerceDateToISO(c.datePublished || c.date || c.dateCreated || c.published);
            if (publishedAt) break;
          }
        }
        if (publishedAt) break;
      } catch (e) {
        // ignore JSON parse errors
      }
    }
  }

  // Finally, check common meta tags like <meta property="article:published_time" content="..."> or <meta name="date" content="...">
  if (!publishedAt) {
    const metaMatch = body.match(/<meta[^>]*(?:property|name)=["']?(?:article:published_time|article:published|date|publication_date)["']?[^>]*content=["']?([^"'\s>]+)["']?/i);
    if (metaMatch && metaMatch[1]) publishedAt = coerceDateToISO(metaMatch[1]);
  }

  // Last-resort: look for rendered text like "Published Aug 23, 2025" or "Published: Aug 23, 2025"
  if (!publishedAt) {
    const humanDateMatch = body.match(/Published\s*[:\-\s]?\s*([A-Za-z]{3,9}\s+\d{1,2},\s*\d{4})/i) || body.match(/Published\s*[:\-\s]?\s*([0-9]{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/i);
    if (humanDateMatch && humanDateMatch[1]) publishedAt = coerceDateToISO(humanDateMatch[1]);
  }
  const tags = attrs.tags || [];

  // Extract the article HTML fragment to avoid pulling head/meta/script content
  const articleHtmlRaw = extractArticleHTML(body);
  const articleHtmlClean = stripScriptsAndStyles(articleHtmlRaw);

  // Build a human-friendly summary: prefer front-matter summary, else first paragraph
  const summary = (attrs.summary && String(attrs.summary).trim()) || firstParagraphText(articleHtmlClean) || htmlToText(articleHtmlClean).slice(0, 240);
  const readTime = estimateReadTime(htmlToText(articleHtmlClean));

  // also write a per-post JSON file with full content (cleaned fragment)
  const postFull = { id: slug, slug, title, summary, publishedAt, tags, readTime, html: articleHtmlClean };
    try {
      const outFile = path.join(postsOutDir, `${slug}.json`);
      fs.writeFileSync(outFile, JSON.stringify(postFull, null, 2));
    } catch (e) {
      console.warn('Failed to write post JSON for', slug, e && e.message);
    }

  return { id: slug, slug, title, summary, publishedAt, tags, readTime };
  });

  posts.sort((a,b) => {
    if (a.publishedAt && b.publishedAt) return new Date(b.publishedAt) - new Date(a.publishedAt);
    return a.slug.localeCompare(b.slug);
  });

  const outPath = path.join(outDir, 'blog-index.json');
  fs.writeFileSync(outPath, JSON.stringify({ posts }, null, 2));
  console.log('Wrote', outPath);
  console.log('Wrote per-post JSON files to', postsOutDir);
}

if (require.main === module) {
  generate();
}

module.exports = { generate };
