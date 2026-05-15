// api/post/[id].js - TEST VERSION (Redis မပါ)
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // ✅ Always return success for testing
  return res.status(200).json({ 
    success: true, 
    message: 'Test delete success',
    method: req.method,
    id: req.query.id,
    token: req.headers.authorization ? 'yes' : 'no'
  });
}