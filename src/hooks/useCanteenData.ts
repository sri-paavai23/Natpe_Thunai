import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CANTEEN_COLLECTION_ID } from '@/lib/appwrite'; // Fixed: Corrected import
import { Models, Query, ID } from 'appwrite';
import { toast } from 'sonner';

export interface CanteenItem extends Models.Document {
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: string; // e.g., "Breakfast", "Lunch", "Snacks", "Beverages"
  isAvailable: boolean;
  prepTimeMinutes: number;
  posterId: string;
  posterName: string;
}

export const useCanteenData = () => {
  const [canteenItems, setCanteenItems] = useState<CanteenItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCanteenItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        [Query.orderDesc('$createdAt')]
      );
      setCanteenItems(response.documents as unknown as CanteenItem[]);
    } catch (err: any) {
      console.error("Error fetching canteen items:", err);
      setError(err.message || "Failed to load canteen items.");
      toast.error(err.message || "Failed to load canteen items.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCanteenItems();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_CANTEEN_COLLECTION_ID}.documents`,
      (response) => {
        // For simplicity, re-fetch all items on any change
        fetchCanteenItems();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchCanteenItems]);

  return { canteenItems, isLoading, error, refreshCanteenItems: fetchCanteenItems };
};