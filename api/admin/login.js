// api/admin/login.js
import { createClient } from '@vercel/kv';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, error: 'Password မှားနေပါသည်' });
  }

  const token = crypto.randomUUID();
  const kv = createClient({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN });
  await kv.set(`admin_token_${token}`, 'valid', { ex: 86400 }); // 24h expiry

  return res.status(200).json({ success: true, token });
}