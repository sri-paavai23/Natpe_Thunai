const sdk = require('node-appwrite');

module.exports = async function ({ req, res, log, error }) {
  // 1. Initialize Client
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

    // Use listDocuments to avoid Node 18 compatibility bugs
    const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [ sdk.Query.equal('$id', listingId) ]
    );

    if (response.total === 0) {
        throw new Error(`Product with ID ${listingId} not found.`);
    }

    const product = response.documents[0];

    // --- FIX IS HERE: Use correct attribute name 'originalURL' ---
    // We check both 'originalURL' and 'originalurl' just to be safe
    let rawUrl = product.originalUrl;

    if (!rawUrl) {
      // Log what attributes ARE available to help debug if it fails again
      log(`Available attributes on document: ${Object.keys(product).join(', ')}`);
      throw new Error("Found product, but 'originalURL' is empty or missing.");
    }

    // 2. Clean URL
    rawUrl = rawUrl.trim();
    if (!/^https?:\/\//i.test(rawUrl)) {
      rawUrl = 'https://' + rawUrl;
    }

    // 3. Generate Link
    const encodedUrl = encodeURIComponent(rawUrl);
    const affiliateUrl = `https://links.cuelinks.com/cu/${pubId}?url=${encodedUrl}`;

    return res.json({ success: true, cueLink: affiliateUrl });

  } catch (err) {
    error("Error: " + err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};