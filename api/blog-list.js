import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
	try {
		const idxPath = path.join(process.cwd(), 'data', 'blog-index.json');
		if (!fs.existsSync(idxPath)) {
			return res.status(500).json({ error: 'Blog index not generated' });
		}
		const json = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
		return res.status(200).json({ posts: json.posts || [] });
	} catch (err) {
		console.error('blog-list error', err);
		return res.status(500).json({ error: 'Unable to list posts' });
	}
}