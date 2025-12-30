"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CANTEEN_COLLECTION_ID } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import { toast } from 'sonner';

interface CanteenData {
  $id: string;
  name: string;
  collegeId: string;
  status: 'open' | 'closed';
  // Add other canteen-specific fields as needed
}

interface CanteenDataState {
  allCanteens: CanteenData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  addCanteen: (name: string, collegeId: string) => Promise<void>;
  updateCanteen: (canteenId: string, data: Partial<CanteenData>) => Promise<void>;
  deleteCanteen: (canteenId: string) => Promise<void>;
}

export const useCanteenData = (): CanteenDataState => {
  const { userProfile, isLoading: isAuthLoading } = useAuth(); // NEW: Use useAuth hook to get current user's college
  const [allCanteens, setAllCanteens] = useState<CanteenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => setRefetchTrigger(prev => prev + 1);

  useEffect(() => {
    const fetchCanteenData = async () => {
      if (isAuthLoading) return;

      setIsLoading(true);
      setError(null);
      try {
        const queries = [];
        // If user is not a developer, filter by their college
        if (userProfile && userProfile.userType !== 'developer' && userProfile.collegeId) {
          queries.push(Query.equal('collegeId', userProfile.collegeId));
        }

        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_CANTEEN_COLLECTION_ID,
          queries
        );
        setAllCanteens(response.documents as unknown as CanteenData[]);
      } catch (err: any) {
        console.error("Failed to fetch canteen data:", err);
        setError(err.message || "Failed to load canteen data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCanteenData();
  }, [userProfile, isAuthLoading, refetchTrigger]);

  const addCanteen = async (name: string, collegeId: string) => {
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        ID.unique(),
        { name, collegeId, status: 'open' }
      );
      toast.success("Canteen added successfully!");
      refetch();
    } catch (err: any) {
      console.error("Failed to add canteen:", err);
      toast.error(err.message || "Failed to add canteen.");
    }
  };

  const updateCanteen = async (canteenId: string, data: Partial<CanteenData>) => {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        canteenId,
        data
      );
      toast.success("Canteen updated successfully!");
      refetch();
    } catch (err: any) {
      console.error("Failed to update canteen:", err);
      toast.error(err.message || "Failed to update canteen.");
    }
  };

  const deleteCanteen = async (canteenId: string) => {
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        canteenId
      );
      toast.success("Canteen deleted successfully!");
      refetch();
    } catch (err: any) {
      console.error("Failed to delete canteen:", err);
      toast.error(err.message || "Failed to delete canteen.");
    }
  };

  return { allCanteens, isLoading, error, refetch, addCanteen, updateCanteen, deleteCanteen };
};