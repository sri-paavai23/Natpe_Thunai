"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID, APPWRITE_SERVICES_COLLECTION_ID, APPWRITE_ERRANDS_COLLECTION_ID, APPWRITE_LOST_FOUND_COLLECTION_ID, APPWRITE_CANTEEN_COLLECTION_ID, APPWRITE_TOURNAMENTS_COLLECTION_ID, APPWRITE_COLLABORATORS_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { toast } from 'sonner';

// Define a common interface for all feed items
export interface FeedItem {
  $id: string;
  title: string;
  description: string;
  type: 'product' | 'service' | 'errand' | 'lost-found' | 'canteen' | 'tournament' | 'collaborator' | 'cash-exchange';
  posterName: string;
  collegeName: string;
  $createdAt: string;
  imageUrl?: string; // Optional image for products/services
  price?: number; // Optional price for products/canteen
  status?: string; // Optional status for errands/tournaments
}

// Helper function to parse price values from various formats
const parsePriceValue = (value: any): number | undefined => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    // Remove currency symbols, commas, and any text after a slash (like "/day")
    const cleanedValue = value.replace(/[₹$,]/g, '').split('/')[0].trim();
    const parsed = parseFloat(cleanedValue);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
};

// Helper to fetch and normalize items from a collection
const fetchAndNormalize = async (
  collectionId: string,
  type: FeedItem['type'],
  collegeName: string,
  limit: number = 5
): Promise<FeedItem[]> => {
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      collectionId,
      [
        Query.equal('collegeName', collegeName),
        Query.orderDesc('$createdAt'),
        Query.limit(limit),
      ]
    );

    return response.documents.map((doc: any) => ({
      $id: doc.$id,
      title: doc.title || doc.name || 'Untitled', // Handle different title fields
      description: doc.description || doc.details || 'No description',
      type: type === 'product' && doc.type === 'cash-exchange' ? 'cash-exchange' : type, // Special handling for cash-exchange products
      posterName: doc.posterName || doc.sellerName || doc.userName || 'Anonymous',
      collegeName: doc.collegeName,
      $createdAt: doc.$createdAt,
      imageUrl: doc.imageUrl || doc.image || undefined,
      price: parsePriceValue(doc.price || doc.amount), // Use the new parsePriceValue helper
      status: doc.status || undefined,
    }));
  } catch (error) {
    console.error(`Error fetching ${type} items:`, error);
    return [];
  }
};

export const useDiscoveryFeed = (collegeName?: string) => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiscoveryFeed = useCallback(async () => {
    if (!collegeName) {
      setIsLoading(false);
      setFeed([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [
        products,
        services,
        errands,
        lostFound,
        canteen,
        tournaments,
        collaborators,
      ] = await Promise.all([
        fetchAndNormalize(APPWRITE_PRODUCTS_COLLECTION_ID, 'product', collegeName),
        fetchAndNormalize(APPWRITE_SERVICES_COLLECTION_ID, 'service', collegeName),
        fetchAndNormalize(APPWRITE_ERRANDS_COLLECTION_ID, 'errand', collegeName),
        fetchAndNormalize(APPWRITE_LOST_FOUND_COLLECTION_ID, 'lost-found', collegeName),
        fetchAndNormalize(APPWRITE_CANTEEN_COLLECTION_ID, 'canteen', collegeName),
        fetchAndNormalize(APPWRITE_TOURNAMENTS_COLLECTION_ID, 'tournament', collegeName),
        fetchAndNormalize(APPWRITE_COLLABORATORS_COLLECTION_ID, 'collaborator', collegeName),
      ]);

      const combinedFeed = [
        ...products,
        ...services,
        ...errands,
        ...lostFound,
        ...canteen,
        ...tournaments,
        ...collaborators,
      ];

      // Sort all items by creation date (most recent first)
      combinedFeed.sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime());

      setFeed(combinedFeed);
    } catch (err: any) {
      console.error("Error fetching discovery feed:", err);
      setError(err.message || "Failed to load discovery feed.");
      toast.error("Failed to load discovery feed.");
    } finally {
      setIsLoading(false);
    }
  }, [collegeName]);

  useEffect(() => {
    fetchDiscoveryFeed();

    // Optional: Add real-time subscriptions for each collection if needed for live updates
    // This can be complex with many collections, so starting with a simple fetch.
    // For a full real-time feed, you'd need to manage multiple subscriptions and merge updates.

    return () => {
      // Unsubscribe logic if subscriptions were added
    };
  }, [fetchDiscoveryFeed]);

  return {
    feed,
    isLoading,
    error,
    refetchFeed: fetchDiscoveryFeed,
  };
};