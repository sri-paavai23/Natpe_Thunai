export interface Product {
  $id: string;
  imageUrl: string;
  title: string;
  price: string;
  sellerRating: number;
  sellerBadge?: string;
  type: "sell" | "rent" | "gift" | "sports" | "gift-request";
  description: string;
  sellerId: string;
  sellerName: string;
  sellerUpiId: string; // Added UPI ID
  damages?: string;
  location: string;
  isDeveloper?: boolean;
  collegeName: string; // NEW: Add collegeName
  // Type-specific fields added in MarketListingFormWrapper
  category?: string; // Used by Sell
  condition?: string; // Used by Sports
  policies?: string; // Used by Rent
  ambassadorDelivery?: boolean;
  ambassadorMessage?: string;
}

// Removed dummyProducts array. We will fetch from Appwrite.
export const dummyProducts: Product[] = [];