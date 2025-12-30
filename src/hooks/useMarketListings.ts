import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { Product } from '@/lib/utils'; // Import Product interface

interface MarketListingsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useMarketListings = (): MarketListingsState => {
  const { userProfile, loading: isAuthLoading } = useAuth(); // Corrected 'isLoading' to 'loading'
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (isAuthLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      let queries = [
        Query.orderDesc('$createdAt'),
        Query.limit(100) // Limit to 100 products for now
      ];

      // Filter by collegeName if user is not a developer and has a collegeName
      if (userProfile?.role !== 'developer' && userProfile?.collegeName) { // Corrected userType to role, added collegeName
        queries.push(Query.equal('collegeName', userProfile.collegeName));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_PRODUCTS_COLLECTION_ID,
        queries
      );

      setProducts(response.documents as unknown as Product[]); // Cast to unknown first
    } catch (err: any) {
      console.error("Error fetching market listings:", err);
      setError(err.message || "Failed to fetch market listings.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName, userProfile?.role, isAuthLoading]); // Added userProfile.role to dependencies

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, isLoading, error, refetch: fetchProducts };
};