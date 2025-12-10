const sdk = require('node-appwrite');

module.exports = async function (req, res) {
  const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY); // Ensure APPWRITE_API_KEY is set in function environment variables

  const databases = new sdk.Databases(client);
  const users = new sdk.Users(client); // To get user details for notifications

  const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
  const APPWRITE_TRANSACTIONS_COLLECTION_ID = process.env.APPWRITE_TRANSACTIONS_COLLECTION_ID;
  const APPWRITE_PRODUCTS_COLLECTION_ID = process.env.APPWRITE_PRODUCTS_COLLECTION_ID;
  const APPWRITE_USER_PROFILES_COLLECTION_ID = process.env.APPWRITE_USER_PROFILES_COLLECTION_ID;

  if (req.method === 'POST' && req.body) {
    const transactionData = JSON.parse(req.body);
    console.log('Processing new transaction:', transactionData.$id);

    try {
      // Fetch seller's profile to get their level for dynamic commission
      let sellerLevel = 1; // Default level
      try {
        const sellerProfileResponse = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_USER_PROFILES_COLLECTION_ID,
          [sdk.Query.equal('userId', transactionData.sellerId), sdk.Query.limit(1)] // Changed to transactionData.sellerId
        );
        if (sellerProfileResponse.documents.length > 0) {
          sellerLevel = sellerProfileResponse.documents[0].level || 1;
        }
      } catch (profileError) {
        console.warn(`Could not fetch seller profile for user ${transactionData.sellerId}:`, profileError); // Changed to transactionData.sellerId
      }

      // Dynamic commission calculation (simplified for function, actual logic in frontend)
      // This should ideally be a fixed rate for the backend or fetched from a config.
      // For now, using a placeholder.
      const calculateCommissionRate = (level) => {
        const START_RATE = 0.1132; // 11.32% at Level 1
        const MIN_RATE = 0.0537; // 5.37% at Level 25
        const MAX_LEVEL_FOR_MIN_RATE = 25;

        if (level <= 1) return START_RATE;
        if (level >= MAX_LEVEL_FOR_MIN_RATE) return MIN_RATE;

        const levelRange = MAX_LEVEL_FOR_MIN_RATE - 1;
        const rateRange = START_RATE - MIN_RATE;
        const reductionPerLevel = rateRange / levelRange;
        return START_RATE - (level - 1) * reductionPerLevel;
      };

      const COMMISSION_RATE = calculateCommissionRate(sellerLevel);

      // Only process if the status is 'payment_confirmed_to_developer'
      if (transactionData.status === 'payment_confirmed_to_developer') {
        const amount = transactionData.amount;
        const commissionAmount = amount * COMMISSION_RATE;
        const netSellerAmount = amount - commissionAmount;

        // 1. Update transaction status and calculated amounts
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_TRANSACTIONS_COLLECTION_ID,
          transactionData.$id,
          {
            status: 'commission_deducted', // New status after commission is calculated
            commissionAmount: commissionAmount,
            netSellerAmount: netSellerAmount,
            utrId: transactionData.utrId || null, // Log the UTR ID
          }
        );
        console.log(`Transaction ${transactionData.$id} updated with commission and status 'commission_deducted'.`);
        console.log(`Developer Notification: New Payment Claim: Order ${transactionData.$id} by ${transactionData.buyerName}. TR ID: ${transactionData.utrId}. Amount: ${amount}. Commission: ${commissionAmount}. Net to Seller: ${netSellerAmount}.`);


        // 2. Update product status (e.g., mark as sold/rented)
        // First, fetch the product to get its current status
        const product = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_PRODUCTS_COLLECTION_ID,
          transactionData.productId
        );

        // Example: Mark product as sold if it's a 'sell' type
        if (product.type === 'sell') {
          await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_PRODUCTS_COLLECTION_ID,
            transactionData.productId,
            { status: 'sold' } // You'd need to add a 'status' attribute to your products collection
          );
          console.log(`Product ${transactionData.productId} marked as sold.`);
        } else if (product.type === 'rent') { // Handle rent type
          await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_PRODUCTS_COLLECTION_ID,
            transactionData.productId,
            { status: 'rented' } 
          );
          console.log(`Product ${transactionData.productId} marked as rented.`);
        }
        // Add similar logic for 'rent' type (e.g., update availability, set rental period)

        // 3. Simulate Provider Notification (after manual verification and payment to seller)
        console.log(`Provider Notification (Simulated): Upon manual verification and payment, seller ${transactionData.sellerName} will be notified: "Order Confirmed! Prepare ${transactionData.productTitle} for ${transactionData.buyerName}."`);

        res.json({ success: true, message: 'Transaction processed, commission deducted, and product status updated.' });

      } else if (transactionData.status === 'seller_confirmed_delivery') { // NEW: Handle seller_confirmed_delivery status
        // This status means the seller has confirmed delivery, now the developer can mark it as paid.
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_TRANSACTIONS_COLLECTION_ID,
          transactionData.$id,
          {
            status: 'paid_to_seller',
          }
        );
        console.log(`Transaction ${transactionData.$id} updated to 'paid_to_seller' after seller confirmed delivery.`);
        console.log(`Developer Notification: Seller ${transactionData.sellerName} confirmed delivery for transaction ${transactionData.$id}. Proceed with payout of ₹${transactionData.netSellerAmount}.`);
        res.json({ success: true, message: 'Transaction status updated to paid_to_seller after seller confirmation.' });

      } else if (transactionData.status === 'initiated') {
        console.log(`Transaction ${transactionData.$id} initiated. Awaiting payment confirmation from buyer.`);
        res.json({ success: true, message: 'Transaction initiated, awaiting buyer payment confirmation.' });
      } else {
        console.log(`Transaction ${transactionData.$id} has status ${transactionData.status}. No further automatic processing.`);
        res.json({ success: true, message: 'Transaction status already processed or not applicable for this function.' });
      }

    } catch (error) {
      console.error('Function execution failed:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(400).json({ success: false, error: 'Invalid request method or body.' });
  }
};