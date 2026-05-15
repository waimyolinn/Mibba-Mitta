export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed. Use DELETE.' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(403).json({ success: false, error: 'ခွင့်မပြုပါ' });
    }
    
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing post id' });
    }
    
    const { Redis } = await import('@upstash/redis');
    const redis = Redis.fromEnv();
    
    await redis.del(`post_${id}`);
    let postsList = await redis.get('posts_list') || [];
    postsList = postsList.filter(pid => pid != id);
    await redis.set('posts_list', JSON.stringify(postsList));
    
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Delete API error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}