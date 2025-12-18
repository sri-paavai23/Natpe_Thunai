"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from '@/lib/appwrite';
import { Query, Models } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface TotalTransactionsState {
  totalTransactions: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useTotalTransactions = (collegeNameFilter?: string): TotalTransactionsState => {
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotalTransactions = useCallback(async () => {
    if (isAuthLoading || userProfile === null) {
      setIsLoading(true); // Keep loading true while auth is resolving
      return;
    }

    const isDeveloper = userProfile?.role === 'developer';
    const collegeToFilterBy = collegeNameFilter || userProfile?.collegeName;

    if (!isDeveloper && !collegeToFilterBy) {
      setIsLoading(false);
      setTotalTransactions(0);
      setError("User profile is missing college information. Cannot fetch total transactions.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const queries = []; // Removed Query.limit(1)
      if (!isDeveloper && collegeToFilterBy) {
        queries.push(Query.equal('collegeName', collegeToFilterBy));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        queries
      );
      setTotalTransactions(response.total);
    } catch (err: any) {
      console.error("Error fetching total transactions:", err);
      setError(err.message || "Failed to load total transactions for analytics.");
      toast.error("Failed to load total transactions for analytics.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthLoading, collegeNameFilter, userProfile]);

  useEffect(() => {
    if (!isAuthLoading && userProfile !== null) {
      fetchTotalTransactions();
    }
    if (isAuthLoading || userProfile === null) {
        setIsLoading(true);
    }
  }, [fetchTotalTransactions, isAuthLoading, userProfile]);

  return { totalTransactions, isLoading, error, refetch: fetchTotalTransactions };
};