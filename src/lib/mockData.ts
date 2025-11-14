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
  damages?: string;
  location: string;
  isDeveloper?: boolean;
}

export const dummyProducts: Product[] = [
  { 
    $id: "1", 
    imageUrl: "/images/camera.jpg", 
    title: "Vintage Camera", 
    price: "450.00", 
    sellerRating: 4.8, 
    sellerBadge: "Top Seller",
    type: "sell", 
    description: "A classic film camera in excellent condition.",
    sellerId: "user123",
    sellerName: "Alex P.",
    location: "Campus East"
  },
  { 
    $id: "2", 
    imageUrl: "/images/wallet.jpg", 
    title: "Handmade Leather Wallet", 
    price: "75.00", 
    sellerRating: 4.5, 
    type: "sell", 
    description: "Durable, stylish wallet crafted from genuine leather.",
    sellerId: "user456",
    sellerName: "Maria K.",
    location: "Dormitory B"
  },
  { 
    $id: "3", 
    imageUrl: "/images/coffee.jpg", 
    title: "Organic Coffee Beans", 
    price: "25.00", 
    sellerRating: 4.9, 
    type: "gift", 
    description: "Freshly roasted single-origin beans.",
    sellerId: "user789",
    sellerName: "Sam L.",
    location: "Library Cafe"
  },
  { 
    $id: "4", 
    imageUrl: "/images/bike.jpg", 
    title: "Mountain Bike Rental", 
    price: "15.00/day", 
    sellerRating: 4.2, 
    type: "rent", 
    description: "High-quality mountain bike available for daily rental.",
    sellerId: "user001",
    sellerName: "Chris R.",
    location: "Sports Center"
  },
];