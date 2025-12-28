"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_LOST_FOUND_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query, ID } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export interface LostFoundItem extends Models.Document {
  type: "lost" | "found";
  itemName: string;
  description: string;
  imageUrl?: string;
  location: string; // Where it was lost/found
  date: string; // When it was lost/found (ISO string)
  contact: string;
  posterId: string;
  posterName: string;
  status: "Active" | "Resolved";
  collegeName: string;
}

interface LostFoundListingsState {
  items: LostFoundItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  postItem: (data: Omit<LostFoundItem, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "$sequence" | "posterId" | "posterName" | "status" | "collegeName">) => Promise<void>;
  updateItemStatus: (itemId: string, newStatus: "Active" | "Resolved") => Promise<void>;
}

export const useLostAndFoundListings = (): LostFoundListingsState => {
  const { user, userProfile } = useAuth();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!userProfile?.collegeName) {
      setIsLoading(false);
      setItems([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_LOST_FOUND_COLLECTION_ID,
        [
          Query.equal('collegeName', userProfile.collegeName),
          Query.orderDesc('$createdAt')
        ]
      );
      setItems(response.documents as unknown as LostFoundItem[]);
    } catch (err: any) {
      console.error("Error fetching lost and found items:", err);
      setError(err.message || "Failed to load lost and found items.");
      toast.error("Failed to load lost and found items.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName]);

  const postItem = useCallback(async (data: Omit<LostFoundItem, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "$sequence" | "posterId" | "posterName" | "status" | "collegeName">) => {
    if (!user || !userProfile) {
      throw new Error("User not authenticated.");
    }
    if (!userProfile.collegeName) {
      throw new Error("User profile is missing college information.");
    }

    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_LOST_FOUND_COLLECTION_ID,
        ID.unique(),
        {
          ...data,
          posterId: user.$id,
          posterName: user.name,
          status: "Active", // Default status
          collegeName: userProfile.collegeName,
        }
      );
      toast.success(`Your ${data.type} item "${data.itemName}" has been posted!`);
      fetchItems(); // Refetch to update the list
    } catch (err: any) {
      console.error(`Error posting ${data.type} item:`, err);
      toast.error(err.message || `Failed to post ${data.type} item.`);
      throw err;
    }
  }, [user, userProfile, fetchItems]);

  const updateItemStatus = useCallback(async (itemId: string, newStatus: "Active" | "Resolved") => {
    if (!user) {
      throw new Error("User not authenticated.");
    }
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_LOST_FOUND_COLLECTION_ID,
        itemId,
        { status: newStatus }
      );
      toast.success(`Item status updated to "${newStatus}".`);
      fetchItems(); // Refetch to update the list
    } catch (err: any) {
      console.error("Error updating item status:", err);
      toast.error(err.message || "Failed to update item status.");
      throw err;
    }
  }, [user, fetchItems]);

  useEffect(() => {
    fetchItems();

    if (!userProfile?.collegeName) return;

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_LOST_FOUND_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as LostFoundItem;

        if (payload.collegeName !== userProfile.collegeName) {
            return;
        }

        setItems(prev => {
          const existingIndex = prev.findIndex(item => item.$id === payload.$id);

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1) {
              toast.info(`New ${payload.type} item: ${payload.itemName}`);
              return [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              toast.info(`Item updated: ${payload.itemName} is now ${payload.status}`);
              return prev.map(item => item.$id === payload.$id ? payload : item);
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            if (existingIndex !== -1) {
              toast.info(`Item removed: ${payload.itemName}`);
              return prev.filter(item => item.$id !== payload.$id);
            }
          }
          return prev;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchItems, userProfile?.collegeName]);

  return { items, isLoading, error, refetch: fetchItems, postItem, updateItemStatus };
};