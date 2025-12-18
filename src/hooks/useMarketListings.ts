"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_MARKETPLACE_COLLECTION_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';
import { useAuth } from '@/context/AuthContext';

export interface MarketListing extends Models.Document {
  posterId: string;
  posterName: string;
  collegeName: string;
  title: string;
  description: string;
  category: string;
  price: string;
  condition: string;
  contact: string;
  type: "sell" | "rent" | "gift" | "sports";
  rentalPeriod?: string;
  ambassadorDelivery?: boolean;
  ambassadorMessage?: string;
}

export const useMarketListings = (typeFilter?: MarketListing["type"]) => {
  const { userProfile } = useAuth();
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    if (!userProfile?.collegeName) {
      setIsLoading(false);
      setError("User college information not available.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const queries = [
        Query.equal("collegeName", userProfile.collegeName),
        Query.orderDesc("$createdAt"),
      ];

      if (typeFilter) {
        queries.push(Query.equal("type", typeFilter));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_MARKETPLACE_COLLECTION_ID,
        queries
      );
      setListings(response.documents as unknown as MarketListing[]);
    } catch (err: any) {
      console.error("Error fetching marketplace listings:", err);
      setError(err.message || "Failed to fetch marketplace listings.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName, typeFilter]);

  useEffect(() => {
    fetchListings();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_MARKETPLACE_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          setListings((prev) => [response.payload as unknown as MarketListing, ...prev]);
        } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          setListings((prev) =>
            prev.map((listing) =>
              listing.$id === (response.payload as MarketListing).$id
                ? (response.payload as unknown as MarketListing)
                : listing
            )
          );
        } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
          setListings((prev) =>
            prev.filter((listing) => listing.$id !== (response.payload as MarketListing).$id)
          );
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchListings]);

  return { listings, isLoading, error, refetchListings: fetchListings };
};