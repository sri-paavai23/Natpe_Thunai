"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CANTEEN_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query, ID } from 'appwrite';
import { toast } from 'sonner';

interface CanteenItem {
  name: string;
  available: boolean;
}

export interface CanteenData extends Models.Document {
  name: string;
  isOpen: boolean;
  items: CanteenItem[];
}

interface CanteenDataState {
  allCanteens: CanteenData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  updateCanteen: (canteenId: string, updates: Partial<CanteenData>) => Promise<void>;
  addCanteen: (canteenName: string) => Promise<CanteenData | undefined>;
}

export const useCanteenData = (): CanteenDataState => {
  const [allCanteens, setAllCanteens] = useState<CanteenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCanteens = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        [Query.orderAsc('name')]
      );
      setAllCanteens(response.documents as unknown as CanteenData[]);
    } catch (err: any) {
      console.error("Error fetching canteen data:", err);
      setError(err.message || "Failed to load canteen status.");
      toast.error("Failed to load canteen status.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCanteen = useCallback(async (canteenId: string, updates: Partial<CanteenData>) => {
    try {
      // Ensure that if 'items' is being updated, it is sent as a clean array of objects
      const updatePayload = { ...updates };
      
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        canteenId,
        updatePayload
      );
      
      // Real-time subscription handles state update, but we return the doc for immediate feedback
      return;
    } catch (error: any) {
      console.error("Error updating canteen data:", error);
      toast.error(error.message || "Failed to update canteen status.");
      throw error;
    }
  }, []);

  const addCanteen = useCallback(async (canteenName: string): Promise<CanteenData | undefined> => {
    const initialData = {
      name: canteenName,
      isOpen: true,
      // Ensure the structure matches the Appwrite Array attribute definition
      items: [
        { name: "Coffee", available: true },
        { name: "Tea", available: true },
      ],
    };
    try {
      const newDoc = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        ID.unique(),
        initialData
      ) as unknown as CanteenData;
      
      // Real-time subscription handles state update
      return newDoc;
    } catch (e: any) {
      console.error("Error adding canteen:", e);
      toast.error(e.message || "Failed to add new canteen.");
    }
  }, []);

  useEffect(() => {
    fetchCanteens();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_CANTEEN_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as CanteenData;

        setAllCanteens(prev => {
          const existingIndex = prev.findIndex(c => c.$id === payload.$id);

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1) {
              toast.info(`New canteen added: ${payload.name}`);
              return [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              // Update existing document
              return prev.map(c => c.$id === payload.$id ? payload : c);
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            if (existingIndex !== -1) {
              toast.info(`Canteen removed: ${payload.name}`);
              return prev.filter(c => c.$id !== payload.$id);
            }
          }
          return prev;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchCanteens]);

  return { allCanteens, isLoading, error, refetch: fetchCanteens, updateCanteen, addCanteen };
};