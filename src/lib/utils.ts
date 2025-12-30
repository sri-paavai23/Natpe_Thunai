import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import collegesData from '../colleges.json'; // Adjust path as necessary

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility functions for college data
interface College {
  id: string;
  name: string;
}

export const getColleges = (): College[] => {
  return collegesData.colleges;
};

export const getCollegeNameById = (id: string): string | undefined => {
  return collegesData.colleges.find(college => college.id === id)?.name;
};

// Placeholder Product interface and filter function for MarketTabs
export interface Product {
  $id: string;
  title: string;
  description: string;
  price: number;
  type: 'sell' | 'rent';
  status: 'available' | 'sold' | 'rented';
  sellerId: string;
  sellerName: string;
  sellerUpiId: string;
  sellerRating: number;
  location: string;
  collegeName: string;
  servedCollegeIds: string[];
  imageUrl?: string;
  userId: string; // Assuming userId is the same as sellerId for products
  isDeveloper?: boolean; // Added for DiscoveryFeed
}

export const filterProducts = (products: Product[], activeTab: string): Product[] => {
  if (activeTab === 'all') {
    return products;
  }
  return products.filter(product => product.type === activeTab);
};

// Placeholder for generateAvatarUrl
export const generateAvatarUrl = (
  name: string,
  gender: 'male' | 'female' | 'other' | 'prefer-not-to-say',
  userType: 'student' | 'staff' | 'merchant' | 'ambassador',
  avatarStyle: string
): string => {
  // This is a mock implementation. In a real app, you'd integrate with an avatar API.
  const seed = name.replace(/\s/g, '') + gender + userType + avatarStyle;
  return `https://api.dicebear.com/8.x/${avatarStyle}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9&mouth=smile,smirk&eyes=happy,wink`;
};