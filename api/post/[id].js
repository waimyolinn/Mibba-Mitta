export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'DELETE') {
    return res.status(200).json({ success: false, error: 'Use DELETE' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { id } = req.query;
    
    // Import Redis
    const { Redis } = await import('@upstash/redis');
    const redis = Redis.fromEnv();
    
    // Delete from Redis
    await redis.del(`post_${id}`);
    
    // Update posts list
    let postsList = await redis.get('posts_list') || [];
    postsList = postsList.filter(pid => pid != id);
    await redis.set('posts_list', JSON.stringify(postsList));
    
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(200).json({ success: false, error: err.message });
  }
}