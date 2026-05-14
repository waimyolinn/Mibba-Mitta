// api/posts.js - GET all posts from Upstash Redis
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { Redis } = await import('@upstash/redis');
    const redis = Redis.fromEnv();
    
    const postsList = await redis.get('posts_list') || [];
    const posts = [];
    for (const id of postsList) {
      const post = await redis.get(`post_${id}`);
      if (post) posts.push(post);
    }
    return res.status(200).json({ success: true, posts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}