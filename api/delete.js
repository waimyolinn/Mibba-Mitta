import { Redis } from '@upstash/redis';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') {
    return res.status(200).json({ success: false, error: 'Use DELETE' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { id } = req.query;
  
  if (!token) return res.status(200).json({ success: false, error: 'No token' });
  if (!id) return res.status(200).json({ success: false, error: 'No id' });
  
  try {
    const redis = Redis.fromEnv();
    
    const isValid = await redis.get(`admin_token_${token}`);
    if (!isValid) {
      return res.status(200).json({ success: false, error: 'Invalid or expired token' });
    }

    // Get post data to check if it has Cloudinary public_id
    const postData = await redis.get(`post_${id}`);
    if (postData) {
      const post = JSON.parse(postData);
      // If it's a photo, delete from Cloudinary too
      if (post.type === 'photo' && post.public_id) {
        try {
          await cloudinary.uploader.destroy(post.public_id);
        } catch (cloudErr) {
          console.error('Cloudinary delete error:', cloudErr);
        }
      }
    }

    await redis.del(`post_${id}`);
    let postsList = await redis.get('posts_list') || [];
    postsList = postsList.filter(pid => pid != id);
    await redis.set('posts_list', JSON.stringify(postsList));
    
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(200).json({ success: false, error: err.message });
  }
}