export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;
    if (password !== 'yawm257830') {
      return res.status(401).json({ success: false, error: 'Password မှားနေပါသည်' });
    }
    const token = 'admin-token-' + Date.now();
    return res.status(200).json({ success: true, token });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}