"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { toast } from 'sonner';

interface TotalTransactionsState {
  totalTransactions: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useTotalTransactions = (): TotalTransactionsState => {
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotalTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [Query.limit(1)] // We only need the total count
      );
      setTotalTransactions(response.total);
    } catch (err: any) {
      console.error("Error fetching total transactions:", err);
      setError(err.message || "Failed to load total transactions.");
      toast.error("Failed to load total transactions for analytics.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTotalTransactions();
  }, [fetchTotalTransactions]);

  return { totalTransactions, isLoading, error, refetch: fetchTotalTransactions };
};