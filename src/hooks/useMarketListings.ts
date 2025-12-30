"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

interface Product {
  $id: string;
  title: string;
  description: string;
  price: number;
  type: 'sell' | 'rent';
  status: 'available' | 'sold' | 'rented';
  sellerId: string;
  servedCollegeIds: string[];
  imageUrl?: string;
  sellerName?: string;
}

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
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => setRefetchTrigger(prev => prev + 1);

  useEffect(() => {
    const fetchProducts = async () => {
      if (isAuthLoading) return;

      setIsLoading(true);
      setError(null);
      try {
        const queries = [Query.equal('status', 'available')];

        if (userProfile && userProfile.collegeId) {
          queries.push(Query.search('servedCollegeIds', userProfile.collegeId));
        }

        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_PRODUCTS_COLLECTION_ID,
          queries
        );

        const productsWithSellerNames = await Promise.all(
          response.documents.map(async (productDoc) => {
            const product = productDoc as unknown as Product;
            try {
              const sellerProfileResponse = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                APPWRITE_USER_PROFILES_COLLECTION_ID,
                [Query.equal('userId', product.sellerId), Query.limit(1)]
              );
              if (sellerProfileResponse.documents.length > 0) {
                const sellerProfile = sellerProfileResponse.documents[0];
                product.sellerName = sellerProfile.merchantName || `${sellerProfile.firstName} ${sellerProfile.lastName}`;
              }
            } catch (profileError) {
              console.warn(`Could not fetch seller profile for product ${product.$id}:`, profileError);
              product.sellerName = "Unknown Seller";
            }
            return product;
          })
        );

        setProducts(productsWithSellerNames);
      } catch (err: any) {
        console.error("Failed to fetch market listings:", err);
        setError(err.message || "Failed to load market listings.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [userProfile, isAuthLoading, refetchTrigger]);

  return { products, isLoading, error, refetch };
};