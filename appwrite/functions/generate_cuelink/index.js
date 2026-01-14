const sdk = require('node-appwrite');

module.exports = async function ({ req, res, log, error }) {
  // 1. Setup Client
  const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT) 
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new sdk.Databases(client);
  const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
  const COLLECTION_ID = process.env.APPWRITE_PRODUCTS_COLLECTION_ID; 

  if (req.method !== 'POST') {
    return res.json({ success: false, error: 'Method must be POST' }, 400);
  }

  try {
    const payload = JSON.parse(req.body);
    const listingId = payload.listingId;
    const pubId = process.env.CUELINKS_PUB_ID;

    if (!listingId) throw new Error("Missing listingId");
    
    // --- BUG FIX: Use listDocuments instead of getDocument ---
    // This avoids the "request body" error common in older SDKs/Node 18
    const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
            sdk.Query.equal('$id', listingId) // Find the exact ID
        ]
    );

    // Check if we found it
    if (response.total === 0) {
        throw new Error(`Product not found with ID: ${listingId}`);
    }

    const product = response.documents[0];
    let rawUrl = product.original_url;

    if (!rawUrl) throw new Error("Product has no original_url");

    // 2. Clean URL
    rawUrl = rawUrl.trim();
    if (!/^https?:\/\//i.test(rawUrl)) rawUrl = 'https://' + rawUrl;

    // 3. Generate Link
    const encodedUrl = encodeURIComponent(rawUrl);
    const affiliateUrl = `https://links.cuelinks.com/cu/${pubId}?url=${encodedUrl}`;

    return res.json({ success: true, cueLink: affiliateUrl });

  } catch (err) {
    error("Error: " + err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};