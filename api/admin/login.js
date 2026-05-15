// api/admin/login.js
export default async function handler(req, res) {
  // CORS headers (ဘယ် domain ကမဆို ခေါ်လို့ရအောင်)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // OPTIONS request (preflight) အတွက်
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // POST မဟုတ်ရင် တားမယ်
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password } = req.body;
    
    // Environment Variable မှ Password ကို ယူမယ် (မရှိရင် default သုံးမယ်)
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'yawm257830';
    
    // Password စစ်ဆေးခြင်း
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: 'Password မှားနေပါသည်' });
    }

    // Token ထုတ်ခြင်း
    const token = 'admin-token-' + Date.now() + '-' + Math.random().toString(36).substring(2, 10);
    
    return res.status(200).json({ success: true, token: token });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}