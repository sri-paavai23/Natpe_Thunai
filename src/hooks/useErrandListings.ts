"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_ERRANDS_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';
import { toast } from 'sonner';

export interface ErrandPost extends Models.Document {
  title: string;
  description: string;
  type: string; // e.g., 'note-writing', 'instant-help'
  compensation: string;
  deadline?: string;
  contact: string;
  posterId: string;
  posterName: string;
}

interface ErrandListingsState {
  errands: ErrandPost[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useErrandListings = (filterTypes: string[] = []): ErrandListingsState => {
  const [errands, setErrands] = useState<ErrandPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchErrands = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const queries = [Query.orderDesc('$createdAt')];
    
    if (filterTypes.length > 0) {
      // Appwrite only supports 10 queries, so we use a single 'or' query if possible
      queries.push(Query.or(filterTypes.map(type => Query.equal('type', type))));
    }

    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_ERRANDS_COLLECTION_ID,
        queries
      );
      setErrands(response.documents as unknown as ErrandPost[]);
    } catch (err: any) {
      console.error("Error fetching errand listings:", err);
      setError(err.message || "Failed to load errand listings.");
      toast.error("Failed to load errand listings.");
    } finally {
      setIsLoading(false);
    }
  }, [filterTypes]);

  useEffect(() => {
    fetchErrands();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_ERRANDS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as ErrandPost;
        
        // Check if the payload matches the current filter
        const matchesFilter = filterTypes.length === 0 || filterTypes.includes(payload.type);

        setErrands(prev => {
          const existingIndex = prev.findIndex(e => e.$id === payload.$id);

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1 && matchesFilter) {
              toast.info(`New errand posted: ${payload.title}`);
              return [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              toast.info(`Errand updated: ${payload.title}`);
              return prev.map(e => e.$id === payload.$id ? payload : e);
            } else if (matchesFilter) {
                // If updated document now matches filter, add it
                return [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            if (existingIndex !== -1) {
              toast.info(`Errand removed: ${payload.title}`);
              return prev.filter(e => e.$id !== payload.$id);
            }
          }
          return prev;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchErrands, filterTypes]);

  return { errands, isLoading, error, refetch: fetchErrands };
};