import { Redis } from '@upstash/redis';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { id } = req.query;
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }
  
  if (!id) {
    return res.status(400).json({ success: false, error: 'No id provided' });
  }
  
  try {
    const redis = Redis.fromEnv();
    
    // Verify admin token
    const isValid = await redis.get(`admin_token_${token}`);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    // Get post data
    const postData = await redis.get(`post_${id}`);
    if (!postData) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }
    
    const post = JSON.parse(postData);
    
    // If it's a photo with public_id, delete from Cloudinary
    if (post.type === 'photo' && post.public_id) {
      try {
        const cloudResult = await cloudinary.uploader.destroy(post.public_id);
        console.log('Cloudinary delete result:', cloudResult);
      } catch (cloudErr) {
        console.error('Cloudinary delete error:', cloudErr);
        // Continue to delete from Redis even if Cloudinary fails
      }
    }

    // Delete from Redis
    await redis.del(`post_${id}`);
    
    // Update posts list
    let postsList = await redis.get('posts_list') || [];
    if (typeof postsList === 'string') {
      postsList = JSON.parse(postsList);
    }
    postsList = postsList.filter(pid => pid != id);
    await redis.set('posts_list', JSON.stringify(postsList));
    
    return res.status(200).json({ success: true, message: 'Deleted successfully' });
    
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}