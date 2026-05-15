export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { Redis } = await import('@upstash/redis');
    const redis = Redis.fromEnv();
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME;
    
    const body = req.body;
    const msg = body.channel_post;
    if (!msg || msg.chat.username !== CHANNEL_USERNAME) {
      return res.status(200).send('OK');
    }

    let post = { id: msg.message_id, date: msg.date };

    if (msg.photo) {
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
      const fileData = await fileRes.json();
      if (fileData.ok) {
        post.type = 'photo';
        post.image_url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;
        post.caption = msg.caption || '';
      }
    } else if (msg.text) {
      post.type = 'text';
      post.text = msg.text;
    } else {
      return res.status(200).send('OK');
    }

    await redis.set(`post_${msg.message_id}`, JSON.stringify(post));
    let postsList = await redis.get('posts_list') || [];
    postsList.unshift(msg.message_id);
    if (postsList.length > 500) postsList = postsList.slice(0, 500);
    await redis.set('posts_list', JSON.stringify(postsList));

    res.status(200).send('OK');
  } catch (err) {
    console.error('webhook error:', err);
    res.status(200).send('OK');
  }
}