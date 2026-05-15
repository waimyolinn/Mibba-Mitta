// api/posts.js
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get raw data from Redis
    const rawList = await redis.get('posts_list');
    console.log('Raw posts_list type:', typeof rawList);
    console.log('Raw posts_list value:', rawList);
    
    // Parse safely
    let postsList = [];
    if (rawList) {
      if (typeof rawList === 'string') {
        try {
          postsList = JSON.parse(rawList);
        } catch (parseErr) {
          console.error('Failed to parse posts_list:', parseErr);
          postsList = [];
        }
      } else if (Array.isArray(rawList)) {
        postsList = rawList;
      }
    }
    
    const posts = [];
    for (const id of postsList) {
      const rawPost = await redis.get(`post_${id}`);
      if (rawPost) {
        try {
          const post = typeof rawPost === 'string' ? JSON.parse(rawPost) : rawPost;
          posts.push(post);
        } catch (e) {
          console.error(`Failed to parse post_${id}:`, e);
        }
      }
    }
    
    return res.status(200).json({ success: true, posts });
  } catch (err) {
    console.error('posts error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}