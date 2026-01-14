const sdk = require('node-appwrite');

module.exports = async function ({ req, res, log, error }) {
  // --- DEBUGGING: PRINT VARIABLES ---
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  
  // We wrap them in brackets [] so you can see if there are spaces!
  log(`DEBUG Check: Endpoint is [${endpoint}]`);
  log(`DEBUG Check: ProjectID is [${projectId}]`);

  const client = new sdk.Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
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

    // Use listDocuments for safety (bypasses "request body" bugs)
    const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [ sdk.Query.equal('$id', listingId) ]
    );

    if (response.total === 0) throw new Error("Product not found");

    let rawUrl = response.documents[0].original_url;
    if (!rawUrl) throw new Error("Original URL is empty");

    rawUrl = rawUrl.trim();
    if (!/^https?:\/\//i.test(rawUrl)) rawUrl = 'https://' + rawUrl;

    const encodedUrl = encodeURIComponent(rawUrl);
    const affiliateUrl = `https://links.cuelinks.com/cu/${pubId}?url=${encodedUrl}`;

    return res.json({ success: true, cueLink: affiliateUrl });

  } catch (err) {
    error("Error: " + err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};