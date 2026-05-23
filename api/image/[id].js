// api/image/[id].js
export default async function handler(req, res) {
  // CORS for security
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { id } = req.query;
  
  try {
    const { Redis } = await import('@upstash/redis');
    const redis = Redis.fromEnv();
    
    // Get post from Redis
    const post = await redis.get(`post_${id}`);
    if (!post || !post.image_url) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Fetch image from Telegram
    const response = await fetch(post.image_url);
    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to fetch image' });
    }
    
    const buffer = await response.arrayBuffer();
    
    // Cache for 1 day
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
}