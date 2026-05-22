import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const redis = Redis.fromEnv();
    
    const postsList = await redis.get('posts_list') || [];
    if (postsList.length === 0) {
      return res.status(200).json({ success: true, posts: [] });
    }

    // Use mget to fetch all posts in one go
    const keys = postsList.map(id => `post_${id}`);
    const posts = await redis.mget(...keys);
    
    // Filter out any null values in case some posts were deleted but still in the list
    const validPosts = posts.filter(post => post !== null);

    return res.status(200).json({ success: true, posts: validPosts });
  } catch (err) {
    console.error('posts error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
