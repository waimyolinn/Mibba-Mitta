// api/fetch-image.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Missing id' });
  }
  
  try {
    const { Redis } = await import('@upstash/redis');
    const redis = Redis.fromEnv();
    
    const post = await redis.get(`post_${id}`);
    if (!post || !post.image_url) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    const response = await fetch(post.image_url);
    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to fetch' });
    }
    
    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
}