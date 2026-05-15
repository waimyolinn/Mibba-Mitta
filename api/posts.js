import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    // Get and parse posts list
    const rawList = await redis.get('posts_list');
    const postsList = rawList ? JSON.parse(rawList) : [];
    
    const posts = [];
    for (const id of postsList) {
      const rawPost = await redis.get(`post_${id}`);
      if (rawPost) {
        const post = typeof rawPost === 'string' ? JSON.parse(rawPost) : rawPost;
        posts.push(post);
      }
    }
    return res.status(200).json({ success: true, posts });
  } catch (err) {
    console.error('posts error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}