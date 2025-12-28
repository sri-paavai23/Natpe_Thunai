import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query, Models, ID } from 'appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

// Collection IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const MARKET_LISTINGS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_MARKET_LISTINGS_COLLECTION_ID;

export type ProductCategory = "Electronics" | "Books" | "Apparel" | "Services" | "Other";
export type ProductCondition = "New" | "Used - Like New" | "Used - Good" | "Used - Fair";

export interface Product extends Models.Document { // Extend Models.Document
  title: string;
  description: string;
  price: number;
  category: ProductCategory;
  condition: ProductCondition;
  imageUrl?: string;
  sellerId: string;
  sellerName: string;
  collegeName: string;
  contactInfo: string;
  negotiable: boolean;
  status: "Available" | "Sold" | "Pending";
  $sequence: number; // Made $sequence required
}

interface MarketListingsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  postProduct: (productData: Omit<Product, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "sellerId" | "sellerName" | "collegeName" | "status" | "$sequence">) => Promise<void>; // Omit $sequence
  updateProduct: (productId: string, productData: Partial<Product>) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
}

export const useMarketListings = (): MarketListingsState => {
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queries = [
        Query.orderDesc('$createdAt'),
        userProfile?.collegeName ? Query.equal('collegeName', userProfile.collegeName) : Query.limit(100) // Filter by college if available
      ];

      const response = await databases.listDocuments(
        DATABASE_ID,
        MARKET_LISTINGS_COLLECTION_ID,
        queries
      );
      setProducts(response.documents as Product[]); // Type assertion is now safer
    } catch (err: any) {
      console.error("Error fetching market listings:", err);
      setError("Failed to fetch market listings.");
      toast.error("Failed to load market listings.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchProducts();
    }
  }, [fetchProducts, isAuthLoading]);

  const postProduct = async (productData: Omit<Product, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "sellerId" | "sellerName" | "collegeName" | "status" | "$sequence">) => {
    if (!userProfile?.collegeName) {
      toast.error("You must be logged in and have a college name set to post a product.");
      return;
    }

    try {
      const newProduct = await databases.createDocument(
        DATABASE_ID,
        MARKET_LISTINGS_COLLECTION_ID,
        ID.unique(),
        {
          ...productData,
          sellerId: userProfile.$id!,
          sellerName: userProfile.name,
          collegeName: userProfile.collegeName,
          status: "Available", // Default status
          $sequence: 0, // Provide a default for $sequence
        }
      );
      setProducts(prev => [newProduct as Product, ...prev]); // Type assertion is now safer
      toast.success("Product posted successfully!");
    } catch (err: any) {
      console.error("Error posting product:", err);
      toast.error(err.message || "Failed to post product.");
      throw err;
    }
  };

  const updateProduct = async (productId: string, productData: Partial<Product>) => {
    if (!userProfile) {
      toast.error("You must be logged in to update a product.");
      return;
    }

    try {
      const updatedProduct = await databases.updateDocument(
        DATABASE_ID,
        MARKET_LISTINGS_COLLECTION_ID,
        productId,
        productData
      );
      setProducts(prev => prev.map(product => product.$id === productId ? { ...product, ...productData } : product));
      toast.success("Product updated successfully!");
    } catch (err: any) {
      console.error("Error updating product:", err);
      toast.error(err.message || "Failed to update product.");
      throw err;
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!userProfile) {
      toast.error("You must be logged in to delete a product.");
      return;
    }

    try {
      await databases.deleteDocument(
        DATABASE_ID,
        MARKET_LISTINGS_COLLECTION_ID,
        productId
      );
      setProducts(prev => prev.filter(product => product.$id !== productId));
      toast.success("Product deleted successfully!");
    } catch (err: any) {
      console.error("Error deleting product:", err);
      toast.error("Failed to delete product.");
    }
  };

  return {
    products,
    isLoading,
    error,
    refetch: fetchProducts,
    postProduct,
    updateProduct,
    deleteProduct,
  };
};