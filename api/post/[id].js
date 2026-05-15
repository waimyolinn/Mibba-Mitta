// api/post/[id].js
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Allow only DELETE method
  if (req.method !== 'DELETE') {
    return res.status(200).json({ success: false, error: 'Method not allowed. Use DELETE.' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return res.status(200).json({ success: false, error: 'Authorization token missing' });
    }

    const { id } = req.query;
    if (!id) {
      return res.status(200).json({ success: false, error: 'Post ID missing' });
    }

    // Dynamically import Upstash Redis
    const { Redis } = await import('@upstash/redis');
    const redis = Redis.fromEnv();

    // Delete the post
    await redis.del(`post_${id}`);

    // Update the posts list
    let postsList = await redis.get('posts_list') || [];
    postsList = postsList.filter(pid => pid != id);
    await redis.set('posts_list', JSON.stringify(postsList));

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Delete API Error:', err);
    return res.status(200).json({ success: false, error: err.message });
  }
}