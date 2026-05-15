// api/post/[id].js - Temporary version without Redis for testing
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Allow only DELETE
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from header
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    
    // For testing: accept any non-empty token
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(200).json({ success: false, error: 'No token provided' });
    }
    
    const { id } = req.query;
    if (!id) {
      return res.status(200).json({ success: false, error: 'Missing post id' });
    }
    
    // Return success without actually deleting (for testing)
    return res.status(200).json({ success: true, message: 'Test delete successful for id: ' + id });
    
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(200).json({ success: false, error: err.message });
  }
}