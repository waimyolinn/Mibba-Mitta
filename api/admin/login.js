// api/admin/login.js
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { Redis } = await import('@upstash/redis');
    const redis = Redis.fromEnv();
    
    const { password } = req.body;
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!ADMIN_PASSWORD) {
      console.error('ADMIN_PASSWORD environment variable is not set');
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: 'Password မှားနေပါသည်' });
    }

    const token = crypto.randomUUID();
    await redis.set(`admin_token_${token}`, 'valid', { ex: 86400 });

    return res.status(200).json({ success: true, token });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}