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
      const COMMISSION_RATE = 0.30; // 30% commission

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
          }
        );
        console.log(`Transaction ${transactionData.$id} updated with commission and status 'commission_deducted'.`);

        // 2. Update product status (e.g., mark as sold/rented) - This logic can be here or in another function
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
        } else if (product.type === 'rent') { // NEW: Handle rent type
          await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_PRODUCTS_COLLECTION_ID,
            transactionData.productId,
            { status: 'rented' } 
          );
          console.log(`Product ${transactionData.productId} marked as rented.`);
        }
        // Add similar logic for 'rent' type (e.g., update availability, set rental period)

        // 3. Send notifications (conceptual) - This part would typically be triggered once the seller is actually paid
        // For now, we'll log that the developer has the info to pay the seller.
        console.log(`Developer has confirmed payment for ${transactionData.productTitle}.`);
        console.log(`Developer needs to pay seller ${transactionData.sellerName} (UPI: ${transactionData.sellerUpiId}) net amount: ${netSellerAmount}`);

        res.json({ success: true, message: 'Transaction processed, commission deducted, and product status updated.' });

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