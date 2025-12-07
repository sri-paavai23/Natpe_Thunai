"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext'; // NEW: Import useAuth

interface TotalTransactionsState {
  totalTransactions: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useTotalTransactions = (collegeNameFilter?: string): TotalTransactionsState => { // NEW: Renamed parameter to collegeNameFilter
  const { userProfile } = useAuth(); // NEW: Get userProfile here
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotalTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queries = [Query.limit(1)]; // We only need the total count
      // NEW: If user is a developer, or no specific collegeNameFilter is provided, fetch all.
      // Otherwise, filter by the provided collegeNameFilter.
      if (userProfile?.role !== 'developer' && collegeNameFilter) {
        queries.push(Query.equal('collegeName', collegeNameFilter));
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
  }, [collegeNameFilter, userProfile?.role]); // NEW: Depend on userProfile.role

  useEffect(() => {
    fetchTotalTransactions();
  }, [fetchTotalTransactions]);

  return { totalTransactions, isLoading, error, refetch: fetchTotalTransactions };
};