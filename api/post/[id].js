// api/post/[id].js
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Allow only DELETE
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed. Use DELETE.' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { id } = req.query;

    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing post id' });
    }

    // Import Upstash Redis
    const { Redis } = await import('@upstash/redis');
    const redis = Redis.fromEnv();

    // Delete the post
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