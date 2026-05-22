import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') {
    return res.status(200).json({ success: false, error: 'Use DELETE' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { id } = req.query;
  
  if (!token) return res.status(200).json({ success: false, error: 'No token' });
  if (!id) return res.status(200).json({ success: false, error: 'No id' });
  
  try {
    const redis = Redis.fromEnv();
    
    // Validate token
    const isValid = await redis.get(`admin_token_${token}`);
    if (!isValid) {
      return res.status(200).json({ success: false, error: 'Invalid or expired token' });
    }

    await redis.del(`post_${id}`);
    let postsList = await redis.get('posts_list') || [];
    postsList = postsList.filter(pid => pid != id);
    await redis.set('posts_list', JSON.stringify(postsList));
    
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(200).json({ success: false, error: err.message });
  }
}
