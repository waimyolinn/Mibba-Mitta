export default async function handler(req, res) {
  // Force JSON response
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Always return success for testing
  return res.status(200).json({ 
    success: true, 
    method: req.method,
    id: req.query.id,
    token_received: !!req.headers.authorization
  });
}