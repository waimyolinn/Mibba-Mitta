// api/post/[id].js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'DELETE') {
    // ❌ 405 မပြန်တော့ဘူး – 200 ပြန်မယ်
    return res.status(200).json({ success: false, error: 'Method not DELETE' });
  }

  const token = req.headers.authorization?.replace('Bearer ', '');
  const { id } = req.query;
  
  return res.status(200).json({ 
    success: true, 
    message: 'Test delete', 
    token_received: !!token,
    id_received: id
  });
}