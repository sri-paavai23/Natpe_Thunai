"use client";

import { useState, useEffect, useCallback } from "react";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Product } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";

export const useMarketListings = () => {
  const { userProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!userProfile?.collegeName) {
      setProducts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_PRODUCTS_COLLECTION_ID,
        [
          Query.equal("collegeName", userProfile.collegeName),
          Query.orderDesc("$createdAt"),
          Query.limit(100)
        ]
      );

      const mappedProducts = response.documents.map((doc: any) => ({
        $id: doc.$id,
        title: doc.title,
        price: doc.price,
        description: doc.description,
        imageUrl: doc.imageUrl,
        type: doc.type,
        category: doc.category,
        condition: doc.condition,
        location: doc.location,
        userId: doc.userId,
        sellerName: doc.sellerName,
        sellerUpiId: doc.sellerUpiId,
        $createdAt: doc.$createdAt,
        ambassadorDelivery: doc.ambassadorDelivery,
      })) as Product[];

      setProducts(mappedProducts);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching market listings:", err);
      setError("Failed to load items.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName]);

  useEffect(() => {
    fetchProducts();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_PRODUCTS_COLLECTION_ID}.documents`,
      (response) => {
        if (
          response.events.includes("databases.*.collections.*.documents.*.create") ||
          response.events.includes("databases.*.collections.*.documents.*.delete") ||
          response.events.includes("databases.*.collections.*.documents.*.update")
        ) {
          fetchProducts();
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchProducts]);

  return { products, isLoading, error, refetch: fetchProducts };
};

export default useMarketListings;