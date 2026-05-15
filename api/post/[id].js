export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Allow only DELETE
  if (req.method !== 'DELETE') {
    return res.status(200).json({ success: false, error: 'Use DELETE method' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { id } = req.query;
    
    if (!token) {
      return res.status(200).json({ success: false, error: 'No token' });
    }
    
    if (!id) {
      return res.status(200).json({ success: false, error: 'No id' });
    }
    
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