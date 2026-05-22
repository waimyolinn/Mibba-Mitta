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
    let notificationBody = '';

    if (msg.photo) {
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
      const fileData = await fileRes.json();
      if (fileData.ok) {
        post.type = 'photo';
        post.image_url = `https://api.telegram.org/file/bot${BOT_TOKEN}/${fileData.result.file_path}`;
        post.caption = msg.caption || '';
        notificationBody = msg.caption || 'ပုံအသစ်တင်ထားပါပြီ။';
      }
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

    // Send Push Notifications to all registered Expo tokens
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

        // Expo allows up to 100 messages per request
        for (let i = 0; i < messages.length; i += 100) {
          const chunk = messages.slice(i, i + 100);
          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(chunk),
          });
        }
      }
    } catch (pushError) {
      console.error('Push notification error:', pushError);
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('webhook error:', err);
    res.status(200).send('OK');
  }
}
