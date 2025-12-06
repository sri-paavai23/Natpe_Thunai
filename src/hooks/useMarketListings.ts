"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';
import { toast } from 'sonner';
import { Product } from '@/lib/mockData'; // Assuming Product interface is still needed
import { useAuth } from '@/context/AuthContext'; // NEW: Import useAuth

interface MarketListingsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useMarketListings = (): MarketListingsState => {
  const { userProfile } = useAuth(); // NEW: Get userProfile to access collegeName
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!userProfile?.collegeName) { // NEW: Only fetch if collegeName is available
      setIsLoading(false);
      setProducts([]); // Clear products if no college is set
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const queries = [
        Query.orderDesc('$createdAt'),
        Query.equal('collegeName', userProfile.collegeName) // NEW: Filter by collegeName
      ];

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_PRODUCTS_COLLECTION_ID,
        queries
      );
      setProducts(response.documents as unknown as Product[]);
    } catch (err: any) {
      console.error("Error fetching market listings:", err);
      setError(err.message || "Failed to load market listings.");
      toast.error("Failed to load market listings.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName]); // NEW: Depend on userProfile.collegeName

  useEffect(() => {
    fetchProducts();

    if (!userProfile?.collegeName) return; // NEW: Only subscribe if collegeName is available

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_PRODUCTS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as Product;

        // NEW: Filter real-time updates by collegeName
        if (payload.collegeName !== userProfile.collegeName) {
            return;
        }

        setProducts(prev => {
          const existingIndex = prev.findIndex(p => p.$id === payload.$id);

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1) {
              toast.info(`New listing posted: ${payload.title}`);
              return [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              toast.info(`Listing updated: ${payload.title}`);
              return prev.map(p => p.$id === payload.$id ? payload : p);
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            if (existingIndex !== -1) {
              toast.info(`Listing removed: ${payload.title}`);
              return prev.filter(p => p.$id !== payload.$id);
            }
          }
          return prev;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchProducts, userProfile?.collegeName]); // NEW: Depend on userProfile.collegeName

  return { products, isLoading, error, refetch: fetchProducts };
};