const fs = require('fs');
const path = require('path');

exports.handler = async function(event, context) {
	try {
		const idxPath = path.join(__dirname, '..', '..', 'data', 'blog-index.json');
		if (!fs.existsSync(idxPath)) {
			return { statusCode: 500, body: JSON.stringify({ error: 'Blog index not generated' }) };
		}
		const json = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
		return { statusCode: 200, body: JSON.stringify({ posts: json.posts || [] }) };
	} catch (err) {
		console.error('blog-list error', err);
		return { statusCode: 500, body: JSON.stringify({ error: 'Unable to list posts' }) };
	}
};
