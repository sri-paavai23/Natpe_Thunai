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
}

export const dummyProducts: Product[] = [
  { 
    $id: "1", 
    imageUrl: "/images/camera.jpg", 
    title: "Vintage Camera", 
    price: "₹450.00", 
    sellerRating: 4.8, 
    sellerBadge: "Top Seller",
    type: "sell", 
    description: "A classic film camera in excellent condition.",
    sellerId: "user123",
    sellerName: "Alex P.",
    sellerUpiId: "seller123@upi",
    location: "Campus East"
  },
  { 
    $id: "2", 
    imageUrl: "/images/wallet.jpg", 
    title: "Used Leather Wallet", 
    price: "₹75.00", 
    sellerRating: 4.5, 
    type: "sell", 
    description: "Durable, stylish wallet crafted from genuine leather.",
    sellerId: "user456",
    sellerName: "Maria K.",
    sellerUpiId: "seller456@upi",
    location: "Dormitory B"
  },
  { 
    $id: "3", 
    imageUrl: "/app-logo.png", // Default image used
    title: "Organic Coffee Beans (Gift)", 
    price: "Free", 
    sellerRating: 4.9, 
    type: "gift", 
    description: "Freshly roasted single-origin beans, free for pickup.",
    sellerId: "user789",
    sellerName: "Sam L.",
    sellerUpiId: "seller789@upi",
    location: "Library Cafe"
  },
  { 
    $id: "4", 
    imageUrl: "/images/bike.jpg", 
    title: "Mountain Bike Rental", 
    price: "₹15.00/day", 
    sellerRating: 4.2, 
    type: "rent", 
    description: "High-quality mountain bike available for daily rental.",
    sellerId: "user001",
    sellerName: "Chris R.",
    sellerUpiId: "seller001@upi",
    location: "Sports Center"
  },
  { 
    $id: "5", 
    imageUrl: "https://via.placeholder.com/300x200?text=Handmade+Jewelry", 
    title: "Custom Beaded Bracelet", 
    price: "₹250.00", 
    sellerRating: 5.0, 
    type: "gift", 
    description: "Handmade bracelet with custom color options.",
    sellerId: "user101",
    sellerName: "Priya S.",
    sellerUpiId: "seller101@upi",
    location: "Arts Block"
  },
  { 
    $id: "6", 
    imageUrl: "https://via.placeholder.com/300x200?text=Cricket+Bat", 
    title: "Used Cricket Bat (Good Condition)", 
    price: "₹1200.00", 
    sellerRating: 4.0, 
    type: "sports", 
    description: "Willow cricket bat, lightly used for one season.",
    sellerId: "user202",
    sellerName: "Ravi V.",
    sellerUpiId: "seller202@upi",
    location: "Hostel C"
  },
];