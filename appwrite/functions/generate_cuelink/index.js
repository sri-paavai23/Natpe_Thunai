const sdk = require('node-appwrite');

module.exports = async function ({ req, res, log, error }) {
  const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new sdk.Databases(client);
  
  // USE ENV VARIABLES (Hardcoded IDs often cause errors)
  const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
  const COLLECTION_ID = process.env.APPWRITE_PRODUCTS_COLLECTION_ID; 

  if (req.method !== 'POST') {
    return res.json({ success: false, error: 'Method must be POST' }, 400);
  }

  try {
    const payload = JSON.parse(req.body);
    const listingId = payload.listingId;
    const pubId = process.env.CUELINKS_PUB_ID;

    // Debug Logs
    log(`Processing Listing: ${listingId}`);
    log(`Using DB: ${DATABASE_ID}, Collection: ${COLLECTION_ID}`);

    if (!listingId) throw new Error("Missing listingId in payload");
    if (!DATABASE_ID) throw new Error("Missing APPWRITE_DATABASE_ID env var");
    if (!COLLECTION_ID) throw new Error("Missing APPWRITE_PRODUCTS_COLLECTION_ID env var");
    if (!pubId) throw new Error("Missing CUELINKS_PUB_ID env var");

    // 1. Fetch the document
    let product;
    try {
        product = await databases.getDocument(DATABASE_ID, COLLECTION_ID, listingId);
    } catch (dbError) {
        // Specific error if document is missing or permission denied
        throw new Error(`DB Error: ${dbError.message} (Check Collection ID & Permissions)`);
    }

    let rawUrl = product.original_url;

    if (!rawUrl) {
      throw new Error(`Listing found, but 'original_url' field is empty.`);
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
    error("Function Failed: " + err.message);
    // Return the ACTUAL error message to the frontend
    return res.json({ success: false, error: err.message }, 500);
  }
};