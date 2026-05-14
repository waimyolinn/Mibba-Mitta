// api/post/[id].js - DELETE a post
import { createClient } from '@vercel/kv';

async function verifyAdminToken(req, kv) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) return false;
  const isValid = await kv.get(`admin_token_${token}`);
  return isValid !== null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const kv = createClient({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
  const isAdmin = await verifyAdminToken(req, kv);
  if (!isAdmin) {
    return res.status(403).json({ success: false, error: 'ခွင့်မပြုပါ' });
  }

  const { id } = req.query;
  if (!id) return res.status(400).json({ success: false, error: 'Missing id' });

  try {
    await kv.del(`post_${id}`);
    let postsList = await kv.get('posts_list') || [];
    postsList = postsList.filter(pid => pid != id);
    await kv.set('posts_list', JSON.stringify(postsList));
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}