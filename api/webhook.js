import { Redis } from '@upstash/redis';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const redis = Redis.fromEnv();
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME;
    
    const body = req.body;
    const msg = body.channel_post;
    
    if (!msg || msg.chat.username !== CHANNEL_USERNAME) {
      return res.status(200).send('OK');
    }

    let post = { id: msg.message_id, date: msg.date };
    let notificationBody = '';

    // 📸 PHOTO - Upload to Cloudinary
    if (msg.photo) {
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      
      const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
      const fileData = await fileRes.json();
      
      if (fileData.ok) {
        const telegramUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;
        
        const imageResponse = await fetch(telegramUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
        
        // ✅ Fix: remove any slashes from public_id
        const safeId = `${msg.message_id}_${Date.now()}`.replace(/\//g, '_');
        
        const uploadResult = await cloudinary.uploader.upload(`data:${mimeType};base64,${base64Image}`, {
          upload_preset: 'telegram_preset',
          folder: 'telegram_images',
          public_id: safeId,
          display_name: safeId
        });
        
        post.type = 'photo';
        post.image_url = uploadResult.secure_url;
        post.public_id = uploadResult.public_id;
        post.caption = msg.caption || '';
        notificationBody = msg.caption || 'ပုံအသစ်တင်ထားပါပြီ။';
      }
      
    // 📝 TEXT
    } else if (msg.text) {
      post.type = 'text';
      post.text = msg.text;
      notificationBody = msg.text.substring(0, 100) + (msg.text.length > 100 ? '...' : '');
    } else {
      return res.status(200).send('OK');
    }

    // Save to Redis
    await redis.set(`post_${msg.message_id}`, JSON.stringify(post));
    
    let postsList = await redis.get('posts_list') || [];
    postsList.unshift(msg.message_id);
    if (postsList.length > 500) postsList = postsList.slice(0, 500);
    await redis.set('posts_list', JSON.stringify(postsList));

    // Send Push Notifications
    try {
      const tokens = await redis.smembers('expo_push_tokens');
      if (tokens && tokens.length > 0) {
        const messages = tokens.map(token => ({
          to: token,
          sound: 'default',
          title: 'MIBA MYITTA',
          body: notificationBody,
          data: { url: 'https://mibamyitta.shop' },
        }));
        for (let i = 0; i < messages.length; i += 100) {
          const chunk = messages.slice(i, i + 100);
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chunk),
          });
        }
      }
    } catch (pushError) {
      console.error('Push error:', pushError);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('webhook error:', err);
    res.status(200).send('OK');
  }
}