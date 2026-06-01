import { Redis } from '@upstash/redis';
import { v2 as cloudinary } from 'cloudinary';

const configCloudinary = (channel) => {
  if (channel === process.env.CHANNEL_USERNAME_2) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME_2,
      api_key: process.env.CLOUDINARY_API_KEY_2,
      api_secret: process.env.CLOUDINARY_API_SECRET_2
    });
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
  }
};

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Admin Token Verification
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

  try {
    const redis = Redis.fromEnv();
    const isValid = await redis.get(`admin_token_${token}`);
    if (!isValid) return res.status(401).json({ success: false, error: 'Invalid or expired token' });

    let idsToDelete = [];

    // Bulk Delete (POST)
    if (req.method === 'POST') {
      if (req.body && Array.isArray(req.body.ids)) {
        idsToDelete = req.body.ids;
      } else {
        return res.status(400).json({ success: false, error: 'Invalid IDs format for bulk delete' });
      }
    } 
    // Single Delete (DELETE)
    else if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ success: false, error: 'No ID provided' });
      idsToDelete = [id];
    } 
    else {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    let deletedCount = 0;
    for (const id of idsToDelete) {
      try {
        const postData = await redis.get(`post_${id}`);
        if (!postData) continue;

        let post = typeof postData === 'string' ? JSON.parse(postData) : postData;

        // Cloudinary Deletion
        if (post.type === 'photo' && post.public_id) {
          configCloudinary(post.channel);
          await cloudinary.uploader.destroy(post.public_id, { invalidate: true });
        }

        // Redis Deletion
        await redis.del(`post_${id}`);
        deletedCount++;
      } catch (err) {
        console.error(`Error deleting post ${id}:`, err);
      }
    }

    // Update posts list
    let postsListRaw = await redis.get('posts_list');
    let postsList = [];
    if (postsListRaw) {
      postsList = typeof postsListRaw === 'string' ? JSON.parse(postsListRaw) : postsListRaw;
    }
    if (Array.isArray(postsList)) {
      postsList = postsList.filter(pid => !idsToDelete.includes(pid.toString()) && !idsToDelete.includes(Number(pid)));
      await redis.set('posts_list', JSON.stringify(postsList));
    }

    return res.status(200).json({ 
      success: true, 
      message: `${deletedCount} posts deleted successfully` 
    });

  } catch (err) {
    console.error('Delete handler error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
