// api/post/[id].js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // ✅ Allow DELETE method
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed. Use DELETE.' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    
    // Check token
    if (!token || token === 'null' || token === 'undefined') {
      return res.status(200).json({ success: false, error: 'No token provided' });
    }
    
    const { id } = req.query;
    if (!id) {
      return res.status(200).json({ success: false, error: 'Missing post id' });
    }
    
    // ✅ For now, return success without Redis (test mode)
    return res.status(200).json({ success: true, message: 'Post ' + id + ' would be deleted' });
    
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(200).json({ success: false, error: err.message });
  }
}