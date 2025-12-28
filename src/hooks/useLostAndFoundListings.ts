import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query, Models, ID } from 'appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

// Collection IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const LOST_FOUND_COLLECTION_ID = import.meta.env.VITE_APPWRITE_LOST_FOUND_COLLECTION_ID;

export type ItemStatus = "Lost" | "Found" | "Reclaimed";
export type ItemType = "Electronics" | "Documents" | "Personal Item" | "Apparel" | "Other";

export interface LostFoundItem extends Models.Document {
  title: string;
  description: string;
  type: ItemType;
  status: ItemStatus;
  location: string; // Where it was lost/found
  contactInfo: string; // How to contact the poster
  imageUrl?: string;
  posterId: string;
  posterName: string;
  collegeName: string;
  reclaimedBy?: string; // User ID of who reclaimed it
  reclaimedDate?: string; // ISO date string
}

interface LostFoundListingsState {
  items: LostFoundItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  postItem: (itemData: Omit<LostFoundItem, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "posterId" | "posterName" | "collegeName" | "status" | "reclaimedBy" | "reclaimedDate">) => Promise<void>;
  updateItemStatus: (itemId: string, newStatus: ItemStatus, reclaimedBy?: string) => Promise<void>;
}

export const useLostAndFoundListings = (): LostFoundListingsState => {
  const { user, userProfile } = useAuth();
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queries = [
        Query.orderDesc('$createdAt'),
        userProfile?.collegeName ? Query.equal('collegeName', userProfile.collegeName) : Query.limit(100) // Filter by college if available
      ];

      const response = await databases.listDocuments(
        DATABASE_ID,
        LOST_FOUND_COLLECTION_ID,
        queries
      );
      setItems(response.documents as LostFoundItem[]);
    } catch (err: any) {
      console.error("Error fetching lost and found items:", err);
      setError("Failed to fetch lost and found items.");
      toast.error("Failed to load lost and found items.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const postItem = async (itemData: Omit<LostFoundItem, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "posterId" | "posterName" | "collegeName" | "status" | "reclaimedBy" | "reclaimedDate">) => {
    if (!user || !userProfile?.collegeName) {
      toast.error("You must be logged in and have a college name set to post an item.");
      return;
    }

    try {
      const newItem = await databases.createDocument(
        DATABASE_ID,
        LOST_FOUND_COLLECTION_ID,
        ID.unique(),
        {
          ...itemData,
          posterId: user.$id,
          posterName: user.name,
          collegeName: userProfile.collegeName,
          status: itemData.type === "Lost" ? "Lost" : "Found", // Default status based on type
        }
      );
      setItems(prev => [newItem as LostFoundItem, ...prev]);
      toast.success("Item posted successfully!");
    } catch (err: any) {
      console.error("Error posting item:", err);
      toast.error(err.message || "Failed to post item.");
      throw err;
    }
  };

  const updateItemStatus = async (itemId: string, newStatus: ItemStatus, reclaimedBy?: string) => {
    if (!user) {
      toast.error("You must be logged in to update an item.");
      return;
    }

    try {
      const dataToUpdate: Partial<LostFoundItem> = { status: newStatus };
      if (newStatus === "Reclaimed" && reclaimedBy) {
        dataToUpdate.reclaimedBy = reclaimedBy;
        dataToUpdate.reclaimedDate = new Date().toISOString();
      }

      const updatedItem = await databases.updateDocument(
        DATABASE_ID,
        LOST_FOUND_COLLECTION_ID,
        itemId,
        dataToUpdate
      );
      setItems(prev => prev.map(item => item.$id === itemId ? { ...item, ...dataToUpdate } : item));
      toast.success(`Item status updated to ${newStatus}!`);
    } catch (err: any) {
      console.error("Error updating item status:", err);
      toast.error(err.message || "Failed to update item status.");
      throw err;
    }
  };

  return {
    items,
    isLoading,
    error,
    refetch: fetchItems,
    postItem,
    updateItemStatus,
  };
};