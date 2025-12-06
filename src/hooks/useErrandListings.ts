import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_ERRANDS_COLLECTION_ID } from '@/lib/appwrite'; // Fixed: Corrected import
import { Models, Query } from 'appwrite';
import { toast } from 'sonner';

export interface ErrandPost extends Models.Document {
  title: string;
  description: string;
  reward: number; // Amount offered for completing the errand
  status: "Open" | "Accepted" | "Completed";
  posterId: string;
  posterName: string;
  acceptedById?: string; // User who accepted the errand
  acceptedByName?: string;
  location: string; // Where the errand needs to be done/delivered
  deadline: string; // ISO date string
}

export const useErrandListings = () => {
  const [errands, setErrands] = useState<ErrandPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchErrands = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_ERRANDS_COLLECTION_ID,
        [Query.orderDesc('$createdAt')]
      );
      setErrands(response.documents as unknown as ErrandPost[]);
    } catch (err: any) {
      console.error("Error fetching errands:", err);
      setError(err.message || "Failed to load errands.");
      toast.error(err.message || "Failed to load errands.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchErrands();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_ERRANDS_COLLECTION_ID}.documents`,
      (response) => {
        // For simplicity, re-fetch all items on any change
        fetchErrands();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchErrands]);

  return { errands, isLoading, error, refreshErrands: fetchErrands };
};