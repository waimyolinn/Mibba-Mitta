// api/admin/login.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { Redis } = await import('@upstash/redis');
    const redis = Redis.fromEnv();
    
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    const { password } = req.body;
    
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: 'Password မှားနေပါသည်' });
    }

    const token = crypto.randomUUID();
    await redis.set(`admin_token_${token}`, 'valid', { ex: 86400 });

    return res.status(200).json({ success: true, token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
}