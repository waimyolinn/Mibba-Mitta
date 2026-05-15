// api/post/[id].js - Cloudflare Worker style
export default async function handler(req, res) {
  // CORS headers (Cloudflare ကအတိုင်း)
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  // OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(204).setHeaders(headers).end();
  }
  
  // Allow only DELETE
  if (req.method !== 'DELETE') {
    return res.status(405).setHeaders(headers).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    
    // Simple token check (Cloudflare လိုမျိုး)
    if (!token) {
      return res.status(403).setHeaders(headers).json({ success: false, error: 'ခွင့်မပြုပါ' });
    }
    
    // Get post ID from URL
    const { id } = req.query;
    if (!id) {
      return res.status(400).setHeaders(headers).json({ success: false, error: 'Missing id' });
    }
    
    // Import Redis
    const { Redis } = await import('@upstash/redis');
    const redis = Redis.fromEnv();
    
    // Delete post
    await redis.del(`post_${id}`);
    
    // Update posts list
    let postsList = await redis.get('posts_list') || [];
    postsList = postsList.filter(pid => pid != id);
    await redis.set('posts_list', JSON.stringify(postsList));
    
    // Return success (Cloudflare လိုမျိုး)
    return res.status(200).setHeaders(headers).json({ success: true });
    
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).setHeaders(headers).json({ success: false, error: err.message });
  }
}