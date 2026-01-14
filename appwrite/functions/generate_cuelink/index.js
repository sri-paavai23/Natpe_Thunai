const sdk = require('node-appwrite');
const axios = require('axios');

module.exports = async function (context) {
    // 1. Log for debugging in Appwrite Console
    context.log("Execution started");

    // 2. Extract payload safely
    let payload;
    if (context.req.body) {
        payload = typeof context.req.body === 'string' 
            ? JSON.parse(context.req.body) 
            : context.req.body;
    } else {
        payload = context.req.payload || {};
    }

    const { listingId, userId } = payload;

    // 3. Validation
    if (!listingId) {
        context.error("Missing listingId in request");
        return context.res.json({ ok: false, error: "Missing listingId" }, 400);
    }

    try {
        // 4. Initialize Appwrite Client
        const client = new sdk.Client()
            .setEndpoint('https://nyc.cloud.appwrite.io/v1') 
            .setProject('690f3ae200352dd0534a')           
            .setKey(process.env.APPWRITE_API_KEY);
    
        const databases = new sdk.Databases(client);

        // 5. Fetch the original URL from your collection
        const document = await databases.getDocument(
            process.env.DB_ID,
            process.env.COLLECTION_ID,
            listingId
        );

        // 6. Request the Affiliate Link from Cuelinks
        const cuelinksRes = await axios.get('https://www.cuelinks.com/api/v2/links.json', {
            params: {
                url: document.original_url,
                apikey: process.env.CUELINKS_API_KEY,
                subid: `natpe_${userId}`
            }
        });

        // 7. Return the link to your frontend
        return context.res.json({
            ok: true,
            cuelink: cuelinksRes.data.results[0].cuelink
        });

    } catch (err) {
        context.error("Execution failed: " + err.message); //
        return context.res.json({ ok: false, error: err.message }, 500);
    }
};