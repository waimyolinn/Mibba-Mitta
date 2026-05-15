export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') {
    return res.status(200).json({ success: false, error: 'Use DELETE' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { id } = req.query;
    if (!token) return res.status(200).json({ success: false, error: 'No token' });
    if (!id) return res.status(200).json({ success: false, error: 'No id' });
    
    const { Redis } = await import('@upstash/redis');
    const redis = Redis.fromEnv();
    
    await redis.del(`post_${id}`);
    let postsList = await redis.get('posts_list') || [];
    postsList = postsList.filter(pid => pid != id);
    await redis.set('posts_list', JSON.stringify(postsList));
    
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(200).json({ success: false, error: err.message });
  }
}