import { Client, Databases } from 'node-appwrite';
import fetch from 'node-fetch'; // For making HTTP requests

module.exports = async (req, res) => {
  const { listingId, userId } = JSON.parse(req.body);

  if (!listingId || !userId) {
    return res.json({
      ok: false,
      message: 'Missing listingId or userId in request body.',
    }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT) // Your Appwrite Endpoint
    .setProject(process.env.APPWRITE_PROJECT_ID) // Your project ID
    .setKey(process.env.APPWRITE_API_KEY); // Your secret API key

  const databases = new Databases(client);

  const CUELINKS_API_KEY = process.env.CUELINKS_API_KEY;
  const AFFILIATE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID; // Database ID where affiliate_listings is
  const AFFILIATE_COLLECTION_ID = process.env.APPWRITE_COLLECTION_AFFILIATE_LISTINGS_ID; // Collection ID for affiliate_listings

  if (!CUELINKS_API_KEY || !AFFILIATE_DATABASE_ID || !AFFILIATE_COLLECTION_ID) {
    return res.json({
      ok: false,
      message: 'Appwrite Function environment variables not set up correctly.',
    }, 500);
  }

  try {
    // 1. Fetch the original URL from Appwrite database
    const listing = await databases.getDocument(
      AFFILIATE_DATABASE_ID,
      AFFILIATE_COLLECTION_ID,
      listingId
    );

    const originalUrl = listing.original_url;
    if (!originalUrl) {
      return res.json({
        ok: false,
        message: 'Original URL not found for the given listing ID.',
      }, 404);
    }

    // 2. Construct the Cuelinks API request
    const cuelinksApiUrl = new URL('https://www.cuelinks.com/api/v2/links.json');
    cuelinksApiUrl.searchParams.append('url', originalUrl);
    cuelinksApiUrl.searchParams.append('apikey', CUELINKS_API_KEY);
    cuelinksApiUrl.searchParams.append('subid', `student_${userId}`); // Add user ID as subid for tracking

    // 3. Make the HTTP request to Cuelinks
    const cuelinksResponse = await fetch(cuelinksApiUrl.toString());
    const cuelinksData = await cuelinksResponse.json();

    if (!cuelinksResponse.ok || cuelinksData.status !== 'success') {
      console.error('Cuelinks API error:', cuelinksData);
      return res.json({
        ok: false,
        message: cuelinksData.message || 'Failed to generate Cuelink.',
      }, cuelinksResponse.status);
    }

    const generatedCuelink = cuelinksData.results[0]?.cuelink;

    if (!generatedCuelink) {
      return res.json({
        ok: false,
        message: 'Cuelink not found in the response from Cuelinks API.',
      }, 500);
    }

    // 4. Return the generated Cuelink
    return res.json({
      ok: true,
      cuelink: generatedCuelink,
    });

  } catch (error) {
    console.error('Error in Appwrite Function:', error);
    return res.json({
      ok: false,
      message: error.message || 'An unexpected error occurred.',
    }, 500);
  }
};