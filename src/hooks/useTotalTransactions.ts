"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from '@/lib/appwrite';
import { Query, Models } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext'; // NEW: Import useAuth

interface TotalTransactionsState {
  totalTransactions: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useTotalTransactions = (collegeNameFilter?: string): TotalTransactionsState => { // NEW: Renamed parameter to collegeNameFilter
  const { userProfile, isLoading: isAuthLoading } = useAuth(); // NEW: Get isAuthLoading
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotalTransactions = useCallback(async () => {
    if (isAuthLoading) { // NEW: Wait for AuthContext to load
      setIsLoading(true);
      return;
    }

    // NEW: If user is not a developer and their collegeName is not set, exit early.
    // This prevents unnecessary API calls and ensures isLoading is set to false.
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
      const queries = [Query.limit(1)]; // We only need the total count
      if (!isDeveloper && collegeToFilterBy) { // Apply collegeName filter ONLY for non-developers
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
  }, [isAuthLoading, collegeNameFilter, userProfile?.role, userProfile?.collegeName]); // NEW: Depend on isAuthLoading

  useEffect(() => {
    fetchTotalTransactions();
  }, [fetchTotalTransactions]);

  return { totalTransactions, isLoading, error, refetch: fetchTotalTransactions };
};