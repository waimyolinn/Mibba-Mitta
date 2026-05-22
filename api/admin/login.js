import { Redis } from '@upstash/redis';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const redis = Redis.fromEnv();
    const { password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: 'Password မှားနေပါသည်' });
    }

    // Use crypto from global or standard web crypto API available in Vercel Edge/Node
    const token = crypto.randomUUID();
    await redis.set(`admin_token_${token}`, 'valid', { ex: 86400 });
    return res.status(200).json({ success: true, token });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
