import { Redis } from '@upstash/redis';
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary Configuration based on the channel the post came from
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).json({ success: false, error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { id } = req.query;

  if (!token || !id) return res.status(400).json({ success: false, error: 'Token and ID are required' });

  try {
    const redis = Redis.fromEnv();
    const isValid = await redis.get(`admin_token_${token}`);
    if (!isValid) return res.status(401).json({ success: false, error: 'Invalid or expired token' });

    const postData = await redis.get(`post_${id}`);
    if (!postData) return res.status(404).json({ success: false, error: 'Post not found' });

    let post;
    try {
      post = typeof postData === 'string' ? JSON.parse(postData) : postData;
    } catch (e) {
      post = { type: 'unknown' };
    }

    // Cloudinary Deletion
    if (post.type === 'photo' && post.public_id) {
      try {
        // Post ထဲမှာ ပါတဲ့ channel အပေါ်မူတည်ပြီး မှန်ကန်တဲ့ Cloudinary account ကို config လုပ်သည်
        configCloudinary(post.channel);
        
        await cloudinary.uploader.destroy(post.public_id, { invalidate: true });
        console.log(`Deleted from Cloudinary (${post.channel || 'default'}): ${post.public_id}`);
      } catch (cloudErr) {
        console.error('Cloudinary delete error:', cloudErr);
      }
    }

    // Redis Deletion
    await redis.del(`post_${id}`);
    let postsListRaw = await redis.get('posts_list');
    let postsList = [];
    if (postsListRaw) {
      postsList = typeof postsListRaw === 'string' ? JSON.parse(postsListRaw) : postsListRaw;
    }
    if (Array.isArray(postsList)) {
      postsList = postsList.filter(pid => pid != id);
      await redis.set('posts_list', JSON.stringify(postsList));
    }

    return res.status(200).json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
