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

// Helper functions for serialization/deserialization
const serializeItems = (items: CanteenItem[]): string[] => {
  return items.map(item => JSON.stringify(item));
};

const deserializeItems = (items: string[]): CanteenItem[] => {
  if (!Array.isArray(items)) return [];
  return items.map(item => {
    try {
      return JSON.parse(item);
    } catch (e) {
      console.error("Failed to parse canteen item:", item, e);
      return { name: "Unknown Item", available: false };
    }
  });
};

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
      
      // Deserialize fetched items
      const deserializedCanteens = (response.documents as any[]).map(doc => ({
          ...doc,
          items: deserializeItems(doc.items || []),
      })) as CanteenData[];

      setAllCanteens(deserializedCanteens);
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
      // Separate items from other updates
      const { items: updatedItems, ...otherUpdates } = updates;

      // Initialize payload with non-item updates, ensuring 'items' is typed as string[] for Appwrite
      const updatePayload: Partial<Omit<CanteenData, 'items'>> & { items?: string[] } = otherUpdates;
      
      // Serialize items if they are being updated
      if (updatedItems) {
          updatePayload.items = serializeItems(updatedItems);
      }
      
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        canteenId,
        updatePayload
      );
      
      return;
    } catch (error: any) {
      console.error("Error updating canteen data:", error);
      toast.error(error.message || "Failed to update canteen status.");
      throw error;
    }
  }, []);

  const addCanteen = useCallback(async (canteenName: string): Promise<CanteenData | undefined> => {
    const initialItems: CanteenItem[] = [
        { name: "Coffee", available: true },
        { name: "Tea", available: true },
    ];
    
    const initialData = {
      name: canteenName,
      isOpen: true,
      // Serialize initial items before sending
      items: serializeItems(initialItems),
    };
    
    try {
      const newDoc = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        ID.unique(),
        initialData
      ) as unknown as Models.Document;
      
      // Deserialize the returned document for local state consistency
      const deserializedDoc: CanteenData = {
          ...(newDoc as any),
          items: deserializeItems((newDoc as any).items || []),
      };

      return deserializedDoc;
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
        const payload = response.payload as any;
        
        // Deserialize payload from real-time update
        const deserializedPayload: CanteenData = {
            ...payload,
            items: deserializeItems(payload.items || []),
        };

        setAllCanteens(prev => {
          const existingIndex = prev.findIndex(c => c.$id === deserializedPayload.$id);

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1) {
              toast.info(`New canteen added: ${deserializedPayload.name}`);
              return [deserializedPayload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              // Update existing document
              return prev.map(c => c.$id === deserializedPayload.$id ? deserializedPayload : c);
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            if (existingIndex !== -1) {
              toast.info(`Canteen removed: ${deserializedPayload.name}`);
              return prev.filter(c => c.$id !== deserializedPayload.$id);
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