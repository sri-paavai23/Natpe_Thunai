const sdk = require('node-appwrite');

module.exports = async function ({ req, res, log, error }) {
  // 1. Initialize Client
  const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  // 2. Validate Request Method
  // GET requests cannot carry the JSON body we need.
  if (req.method !== 'POST') {
    return res.json({ 
      success: false, 
      error: 'Invalid Method. Please use POST and send JSON body.' 
    }, 400);
  }

  // 3. Robust Body Parsing
  let payload;
  try {
    if (!req.body) {
      throw new Error('Request body is empty.');
    }
    // Handle if Appwrite passes body as object or string
    payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    error('JSON Parse Error: ' + e.message);
    return res.json({ success: false, error: 'Invalid JSON format' }, 400);
  }

  // 4. Validate listingId
  if (!payload.listingId) {
    error('Validation Error: Missing listingId in request');
    return res.json({ 
      success: false, 
      error: 'Missing listingId. Payload received: ' + JSON.stringify(payload) 
    }, 400);
  }

  log(`Generating CueLink for Listing ID: ${payload.listingId}`);

  try {
    // --- YOUR GENERATION LOGIC HERE ---
    // Example:
    // const link = `https://your-app.com/cuelink/${payload.listingId}`;
    
    // For now, returning a success dummy response
    return res.json({
      success: true,
      cueLink: `generated-link-for-${payload.listingId}`, 
      message: 'Link generated successfully'
    });

  } catch (err) {
    error('Logic Error: ' + err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};