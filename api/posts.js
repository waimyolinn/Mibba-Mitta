// api/posts.js - GET all posts from Upstash Redis
import { createClient } from '@vercel/kv';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const kv = createClient({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
    const postsList = await kv.get('posts_list') || [];
    const posts = [];
    for (const id of postsList) {
      const post = await kv.get(`post_${id}`);
      if (post) posts.push(post);
    }
    return res.status(200).json({ success: true, posts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}