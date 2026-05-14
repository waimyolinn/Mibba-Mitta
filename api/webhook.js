// api/webhook.js - Telegram webhook receiver
export default async function handler(req, res) {
  // Allow only POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { Redis } = await import('@upstash/redis');
    const redis = Redis.fromEnv();
    
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME;
    
    const body = req.body;
    const msg = body.channel_post;
    
    // Only process messages from your channel
    if (!msg || msg.chat.username !== CHANNEL_USERNAME) {
      return res.status(200).send('OK');
    }

    let post = { id: msg.message_id, date: msg.date };

    // Handle photo posts
    if (msg.photo) {
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
      const fileData = await fileRes.json();
      if (fileData.ok) {
        post.type = 'photo';
        post.image_url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;
        post.caption = msg.caption || '';
      } else {
        throw new Error('Failed to get file info');
      }
    } 
    // Handle text posts
    else if (msg.text) {
      post.type = 'text';
      post.text = msg.text;
    } else {
      return res.status(200).send('OK');
    }

    // Save to Redis
    await redis.set(`post_${msg.message_id}`, JSON.stringify(post));
    
    // Update posts list
    let postsList = await redis.get('posts_list') || [];
    postsList.unshift(msg.message_id);
    if (postsList.length > 500) postsList = postsList.slice(0, 500);
    await redis.set('posts_list', JSON.stringify(postsList));

    // Return 200 OK to Telegram
    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err);
    // Still return 200 to prevent Telegram from retrying
    res.status(200).send('OK');
  }
}