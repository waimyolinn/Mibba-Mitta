export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // For testing - always return success
  return res.status(200).json({
    success: true,
    message: 'Delete endpoint working',
    method: req.method,
    id: req.query.id,
    token: req.headers.authorization || 'none'
  });
}