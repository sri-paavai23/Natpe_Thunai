import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query, Models, ID } from 'appwrite'; // Import ID
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
const CANTEENS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CANTEENS_COLLECTION_ID;
const FOOD_OFFERINGS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_FOOD_OFFERINGS_COLLECTION_ID;

export type FoodCategory = "Meals" | "Beverages" | "Snacks" | "Desserts" | "Other";

export interface CanteenData extends Models.Document { // Extend Models.Document
  name: string;
  collegeName: string;
  location: string;
  contactInfo: string;
  imageUrl?: string;
  openingTime: string; // e.g., "08:00"
  closingTime: string; // e.g., "20:00"
  isOperational: boolean;
}

export interface FoodOffering extends Models.Document { // Extend Models.Document
  canteenId: string;
  canteenName: string;
  name: string;
  description: string;
  price: number;
  category: FoodCategory;
  imageUrl?: string;
  isAvailable: boolean;
}

interface CanteenDataState {
  allCanteens: CanteenData[];
  allOfferings: FoodOffering[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addCanteen: (canteenData: Omit<CanteenData, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">) => Promise<void>;
  updateCanteen: (canteenId: string, data: Partial<CanteenData>) => Promise<void>;
}

export const useCanteenData = (): CanteenDataState => {
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  const [allCanteens, setAllCanteens] = useState<CanteenData[]>([]);
  const [allOfferings, setAllOfferings] = useState<FoodOffering[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCanteenData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const canteenQueries = [
        Query.orderAsc('name'),
        userProfile?.collegeName ? Query.equal('collegeName', userProfile.collegeName) : Query.limit(100) // Filter by college if available
      ];
      const canteenResponse = await databases.listDocuments(
        DATABASE_ID,
        CANTEENS_COLLECTION_ID,
        canteenQueries
      );
      setAllCanteens(canteenResponse.documents as CanteenData[]); // Type assertion is now safer

      const offeringQueries = [
        Query.orderAsc('name'),
        userProfile?.collegeName ? Query.equal('collegeName', userProfile.collegeName) : Query.limit(100) // Filter by college if available
      ];
      const offeringResponse = await databases.listDocuments(
        DATABASE_ID,
        FOOD_OFFERINGS_COLLECTION_ID,
        offeringQueries
      );
      setAllOfferings(offeringResponse.documents as FoodOffering[]); // Type assertion is now safer

    } catch (err: any) {
      console.error("Error fetching canteen data:", err);
      setError("Failed to fetch canteen data.");
      toast.error("Failed to load canteen data.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchCanteenData();
    }
  }, [fetchCanteenData, isAuthLoading]);

  const addCanteen = async (canteenData: Omit<CanteenData, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions">) => {
    if (!userProfile?.collegeName) {
      toast.error("You must be logged in and have a college name set to add a canteen.");
      return;
    }
    try {
      const newCanteen = await databases.createDocument(
        DATABASE_ID,
        CANTEENS_COLLECTION_ID,
        ID.unique(),
        {
          ...canteenData,
          collegeName: userProfile.collegeName,
        }
      );
      setAllCanteens(prev => [newCanteen as CanteenData, ...prev]); // Type assertion is now safer
      toast.success("Canteen added successfully!");
    } catch (err: any) {
      console.error("Error adding canteen:", err);
      toast.error(err.message || "Failed to add canteen.");
      throw err;
    }
  };

  const updateCanteen = async (canteenId: string, data: Partial<CanteenData>) => {
    if (!userProfile) {
      toast.error("You must be logged in to update a canteen.");
      return;
    }
    try {
      const updatedDoc = await databases.updateDocument(
        DATABASE_ID,
        CANTEENS_COLLECTION_ID,
        canteenId,
        data
      );
      setAllCanteens(prev => prev.map(c => c.$id === canteenId ? { ...c, ...data } : c));
      toast.success("Canteen updated successfully!");
    } catch (err: any) {
      console.error("Error updating canteen:", err);
      toast.error(err.message || "Failed to update canteen.");
      throw err;
    }
  };

  return {
    allCanteens,
    allOfferings,
    isLoading,
    error,
    refetch: fetchCanteenData,
    addCanteen,
    updateCanteen,
  };
};