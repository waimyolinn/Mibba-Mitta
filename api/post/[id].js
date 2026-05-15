// api/post/[id].js
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const postId = req.query.id;
    if (!postId) {
      return res.status(400).json({ success: false, error: 'Missing id' });
    }

    // Delete post
    await redis.del(`post_${postId}`);

    // Remove from list
    let rawList = await redis.get('posts_list');
    let postsList = rawList ? JSON.parse(rawList) : [];
    postsList = postsList.filter(pid => pid != postId);
    await redis.set('posts_list', JSON.stringify(postsList));

    return res.status(200).json({ success: true, message: 'ဖျက်ပြီးပါပြီ' });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}