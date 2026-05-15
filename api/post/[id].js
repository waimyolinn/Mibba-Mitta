// api/post/[id].js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Allow only DELETE
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    
    // Simple token check (any non-empty token works for testing)
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(403).json({ success: false, error: 'ခွင့်မပြုပါ - Token မရှိ' });
    }
    
    // Get post ID from URL
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing post id' });
    }
    
    // Import Redis dynamically
    const { Redis } = await import('@upstash/redis');
    const redis = Redis.fromEnv();
    
    // Delete the post from Redis
    await redis.del(`post_${id}`);
    
    // Update posts list
    let postsList = await redis.get('posts_list') || [];
    postsList = postsList.filter(pid => pid != id);
    await redis.set('posts_list', JSON.stringify(postsList));
    
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}