"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

interface TotalTransactionsState {
  totalTransactions: number;
  isLoading: boolean;
  error: string | null;
}

export const useTotalTransactions = (collegeNameFilter?: string): TotalTransactionsState => {
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTotalTransactions = async () => {
      if (isAuthLoading) return;

      setIsLoading(true);
      setError(null);
      try {
        const queries = [];
        // Note: Transactions collection might not directly have collegeId.
        // This would require joining with product/food_order collections or adding collegeId to transactions.
        // For now, we'll fetch all if no direct college filter is available on transactions.
        
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_TRANSACTIONS_COLLECTION_ID,
          queries
        );
        setTotalTransactions(response.total);
      } catch (err: any) {
        console.error("Failed to fetch total transactions:", err);
        setError(err.message || "Failed to load total transactions.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTotalTransactions();
  }, [userProfile, isAuthLoading, collegeNameFilter]);

  return { totalTransactions, isLoading, error };
};