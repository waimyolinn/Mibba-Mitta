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
    
    // Password စစ်ဆေးခြင်း
    if (password !== 'yawm257830') {
      return res.status(401).json({ success: false, error: 'Password မှားနေပါသည်' });
    }

    // Token ထုတ်ခြင်း (Redis မပါဘဲ ရိုးရိုး)
    const token = 'admin-token-' + Date.now();
    
    return res.status(200).json({ success: true, token });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}