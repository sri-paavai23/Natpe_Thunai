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
const ERRAND_LISTINGS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ERRAND_LISTINGS_COLLECTION_ID;

export type ErrandType = "Delivery" | "Pickup" | "Shopping" | "Academic Help" | "Other";
export type ErrandStatus = "Open" | "Assigned" | "Completed" | "Cancelled";

export interface ErrandPost extends Models.Document { // Extend Models.Document
  title: string;
  description: string;
  type: ErrandType;
  reward: number; // Monetary reward for completing the errand
  posterId: string;
  posterName: string;
  collegeName: string;
  status: ErrandStatus;
  assignedToId?: string;
  assignedToName?: string;
  contactInfo: string;
  location?: string; // Specific location for the errand
  deadline?: string; // ISO date string
}

interface ErrandListingsState {
  errands: ErrandPost[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  postErrand: (errandData: Omit<ErrandPost, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "posterId" | "posterName" | "collegeName" | "status" | "assignedToId" | "assignedToName">) => Promise<void>;
  updateErrandStatus: (errandId: string, newStatus: ErrandStatus, assignedToId?: string, assignedToName?: string) => Promise<void>;
}

export const useErrandListings = (filterTypes: string[] = []): ErrandListingsState => {
  const { userProfile } = useAuth();
  const [errands, setErrands] = useState<ErrandPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchErrands = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queries = [
        Query.orderDesc('$createdAt'),
        userProfile?.collegeName ? Query.equal('collegeName', userProfile.collegeName) : Query.limit(100) // Filter by college if available
      ];

      if (filterTypes.length > 0) {
        queries.push(Query.or(filterTypes.map(type => Query.equal('type', type))));
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        ERRAND_LISTINGS_COLLECTION_ID,
        queries
      );
      setErrands(response.documents as ErrandPost[]); // Type assertion is now safer
    } catch (err: any) {
      console.error("Error fetching errand listings:", err);
      setError("Failed to fetch errand listings.");
      toast.error("Failed to load errand listings.");
    } finally {
      setIsLoading(false);
    }
  }, [filterTypes, userProfile?.collegeName]);

  useEffect(() => {
    fetchErrands();
  }, [fetchErrands]);

  const postErrand = async (errandData: Omit<ErrandPost, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "posterId" | "posterName" | "collegeName" | "status" | "assignedToId" | "assignedToName">) => {
    if (!userProfile?.collegeName) {
      toast.error("You must be logged in and have a college name set to post an errand.");
      return;
    }

    try {
      const newErrand = await databases.createDocument(
        DATABASE_ID,
        ERRAND_LISTINGS_COLLECTION_ID,
        ID.unique(),
        {
          ...errandData,
          posterId: userProfile.$id!,
          posterName: userProfile.name,
          collegeName: userProfile.collegeName,
          status: "Open", // Default status
        }
      );
      setErrands(prev => [newErrand as ErrandPost, ...prev]); // Type assertion is now safer
      toast.success("Errand posted successfully!");
    } catch (err: any) {
      console.error("Error posting errand:", err);
      toast.error(err.message || "Failed to post errand.");
      throw err;
    }
  };

  const updateErrandStatus = async (errandId: string, newStatus: ErrandStatus, assignedToId?: string, assignedToName?: string) => {
    if (!userProfile) {
      toast.error("You must be logged in to update an errand.");
      return;
    }

    try {
      const dataToUpdate: Partial<ErrandPost> = { status: newStatus };
      if (assignedToId && assignedToName) {
        dataToUpdate.assignedToId = assignedToId;
        dataToUpdate.assignedToName = assignedToName;
      }

      const updatedErrand = await databases.updateDocument(
        DATABASE_ID,
        ERRAND_LISTINGS_COLLECTION_ID,
        errandId,
        dataToUpdate
      );
      setErrands(prev => prev.map(errand => errand.$id === errandId ? { ...errand, ...dataToUpdate } : errand));
      toast.success(`Errand status updated to ${newStatus}!`);
    } catch (err: any) {
      console.error("Error updating errand status:", err);
      toast.error(err.message || "Failed to update errand status.");
      throw err;
    }
  };

  return {
    errands,
    isLoading,
    error,
    refetch: fetchErrands,
    postErrand,
    updateErrandStatus,
  };
};