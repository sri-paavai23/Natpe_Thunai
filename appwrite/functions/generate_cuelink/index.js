const sdk = require('node-appwrite');

module.exports = async function ({ req, res, log, error }) {
  // 1. Initialize Client
  const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new sdk.Databases(client);
  const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
  const APPWRITE_PRODUCTS_COLLECTION_ID = 'affiliate_listings'; // Ensure this ID is correct

  // 2. Validate Request
  if (req.method !== 'POST') {
    return res.json({ success: false, error: 'Method must be POST' }, 400);
  }

  try {
    const payload = JSON.parse(req.body);
    const listingId = payload.listingId;
    const pubId = process.env.CUELINKS_PUB_ID; // Your Cuelinks ID

    if (!listingId) throw new Error("Missing listingId");
    if (!pubId) throw new Error("Server Misconfiguration: Missing CUELINKS_PUB_ID");

    // 3. Fetch the Original URL from Database
    const product = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_PRODUCTS_COLLECTION_ID,
      listingId
    );

    const originalUrl = product.original_url; // Ensure your DB column is named 'original_url'

    if (!originalUrl) {
      throw new Error(`Product ${listingId} has no original_url field.`);
    }

    // 4. Generate Deep Link (The Fix)
    // We use the direct Cuelinks redirection format. 
    // This is robust: It tells Cuelinks "Send the user HERE".
    // Important: We MUST encodeURIComponent the URL.
    const encodedUrl = encodeURIComponent(originalUrl);
    
    // Format: https://links.cuelinks.com/cu/{PUB_ID}?url={ENCODED_URL}
    // This format supports Universal Links (Mobile Apps)
    const affiliateUrl = `https://links.cuelinks.com/cu/${pubId}?url=${encodedUrl}`;

    log(`Generated for ${listingId}: ${affiliateUrl}`);

    // 5. Return Success
    return res.json({
      success: true,
      cueLink: affiliateUrl
    });

  } catch (err) {
    error("Error generating link: " + err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};