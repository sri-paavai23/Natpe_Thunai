"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from '@/lib/appwrite'; // NEW: Import APPWRITE_USER_PROFILES_COLLECTION_ID
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
    const isDeveloper = userProfile?.role === 'developer';

    if (!isDeveloper && !userProfile?.collegeName) { // Only fetch if collegeName is available for non-developers
      setIsLoading(false);
      setProducts([]); // Clear products if no college is set
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const queries = [
        Query.orderDesc('$createdAt'),
      ];
      if (!isDeveloper) { // Apply collegeName filter ONLY for non-developers
        queries.push(Query.equal('collegeName', userProfile!.collegeName));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_PRODUCTS_COLLECTION_ID,
        queries
      );
      
      // NEW: Fetch seller levels for each product
      const productsWithSellerInfo = await Promise.all(
        (response.documents as unknown as Product[]).map(async (product) => {
          try {
            const sellerProfileResponse = await databases.listDocuments(
              APPWRITE_DATABASE_ID,
              APPWRITE_USER_PROFILES_COLLECTION_ID,
              [Query.equal('userId', product.sellerId), Query.limit(1)]
            );
            const sellerProfile = sellerProfileResponse.documents[0] as any;
            return {
              ...product,
              sellerLevel: sellerProfile?.level ?? 1, // Default to 1 if profile not found
            };
          } catch (sellerError) {
            console.warn(`Could not fetch profile for seller ${product.sellerId}:`, sellerError);
            return { ...product, sellerLevel: 1 }; // Default level if profile fetch fails
          }
        })
      );

      setProducts(productsWithSellerInfo);
    } catch (err: any) {
      console.error("Error fetching market listings:", err);
      setError(err.message || "Failed to load market listings.");
      toast.error("Failed to load market listings.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName, userProfile?.role]); // Depend on userProfile.collegeName AND userProfile.role

  useEffect(() => {
    fetchProducts();

    const isDeveloper = userProfile?.role === 'developer';
    if (!isDeveloper && !userProfile?.collegeName) return; // Only subscribe if collegeName is available for non-developers

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_PRODUCTS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as Product;

        // NEW: Filter real-time updates by collegeName ONLY for non-developers
        if (!isDeveloper && payload.collegeName !== userProfile!.collegeName) {
            return;
        }

        setProducts(prev => {
          const existingIndex = prev.findIndex(p => p.$id === payload.$id);

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1) {
              toast.info(`New listing posted: ${payload.title}`);
              // For new items, we might not have sellerLevel immediately, refetch or fetch it here
              fetchProducts(); // Simpler to refetch all for now
              return prev; // Return previous state, refetch will update
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              toast.info(`Listing updated: ${payload.title}`);
              // For updates, refetch to ensure sellerLevel is fresh
              fetchProducts(); // Simpler to refetch all for now
              return prev; // Return previous state, refetch will update
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

    // NEW: Subscribe to user profile changes to update seller levels in real-time
    const unsubscribeUserProfiles = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_USER_PROFILES_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as any;
        // If a user profile is updated, and it's a seller, we need to refetch products
        // to update their badge/level.
        if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          // Check if the updated profile belongs to a seller of an existing product
          const isSellerOfExistingProduct = products.some(p => p.sellerId === payload.userId);
          if (isSellerOfExistingProduct) {
            fetchProducts(); // Refetch products to update seller levels/badges
          }
        }
      }
    );


    return () => {
      unsubscribe();
      unsubscribeUserProfiles(); // NEW: Unsubscribe from user profiles
    };
  }, [fetchProducts, userProfile?.collegeName, userProfile?.role, products]); // NEW: Depend on products state for user profile subscription

  return { products, isLoading, error, refetch: fetchProducts };
};