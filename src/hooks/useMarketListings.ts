"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';
import { toast } from 'sonner';
import { Product } from '@/lib/mockData';
import { useAuth } from '@/context/AuthContext';

interface MarketListingsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useMarketListings = (): MarketListingsState => {
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    // If userProfile is not yet loaded or is null, we can't fetch products.
    // The useEffect below will handle setting isLoading to false and error if userProfile is null.
    if (!userProfile) {
      return;
    }

    const isDeveloper = userProfile.role === 'developer';
    const collegeToFilterBy = userProfile.collegeName;

    setIsLoading(true);
    setError(null);
    try {
      const queries = [
        Query.orderDesc('$createdAt'),
        Query.equal('status', 'available'),
      ];
      if (!isDeveloper) {
        queries.push(Query.equal('collegeName', collegeToFilterBy));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_PRODUCTS_COLLECTION_ID,
        queries
      );
      
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
              sellerLevel: sellerProfile?.level ?? 1,
            };
          } catch (sellerError) {
            console.warn(`Could not fetch profile for seller ${product.sellerId}:`, sellerError);
            return { ...product, sellerLevel: 1 };
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
  }, [userProfile]); // Dependencies for useCallback are correct

  useEffect(() => {
    if (isAuthLoading) {
      setIsLoading(true);
      setProducts([]); // Clear products while auth is loading
      setError(null);
      return;
    }

    if (userProfile === null) {
      setIsLoading(false);
      setProducts([]);
      setError("User profile not loaded. Cannot fetch market listings.");
      return;
    }

    // If auth is done and userProfile is available, fetch products
    fetchProducts();

    // Setup real-time subscriptions
    const isDeveloper = userProfile.role === 'developer';
    const collegeToFilterBy = userProfile.collegeName;

    // Only subscribe if there's a valid college to filter by, or if it's a developer viewing all
    if (!isDeveloper && !collegeToFilterBy) return;

    const unsubscribeProducts = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_PRODUCTS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as Product;

        // Filter real-time updates by collegeName if not a developer
        if (!isDeveloper && payload.collegeName !== collegeToFilterBy) {
            return;
        }

        // For any product update (create, update, delete), refetch to ensure sellerLevel and sorting are correct.
        // This is simpler than trying to merge/update locally with seller profile data.
        fetchProducts();
      }
    );

    const unsubscribeUserProfiles = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_USER_PROFILES_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as any;
        if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          // If a user profile is updated, and that user is a seller of an existing product, refetch products.
          // This ensures sellerLevel badges are up-to-date.
          const isSellerOfExistingProduct = products.some(p => p.sellerId === payload.userId);
          if (isSellerOfExistingProduct) {
            fetchProducts();
          }
        }
      }
    );

    return () => {
      unsubscribeProducts();
      unsubscribeUserProfiles();
    };
  }, [fetchProducts, isAuthLoading, userProfile]);

  return { products, isLoading, error, refetch: fetchProducts };
};