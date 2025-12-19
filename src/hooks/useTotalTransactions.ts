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
    // If userProfile is not yet loaded or is null, we can't fetch.
    // The useEffect below will handle setting isLoading to false and error if userProfile is null.
    if (!userProfile) {
      return;
    }

    const isDeveloper = userProfile.role === 'developer';
    const collegeToFilterBy = collegeNameFilter || userProfile.collegeName;

    setIsLoading(true);
    setError(null);
    try {
      const queries = []; 
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
  }, [collegeNameFilter, userProfile]);

  useEffect(() => {
    if (isAuthLoading) {
      setIsLoading(true);
      setTotalTransactions(0); // Clear data while auth is loading
      setError(null);
      return;
    }

    if (userProfile === null) {
      setIsLoading(false);
      setTotalTransactions(0);
      setError("User profile not loaded. Cannot fetch total transactions.");
      return;
    }

    // If auth is done and userProfile is available, fetch data
    fetchTotalTransactions();
  }, [fetchTotalTransactions, isAuthLoading, userProfile]);

  return { totalTransactions, isLoading, error, refetch: fetchTotalTransactions };
};