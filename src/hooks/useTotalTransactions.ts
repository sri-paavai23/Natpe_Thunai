import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query } from 'appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

// Collection IDs (replace with your actual IDs for transactions)
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const TRANSACTIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TRANSACTIONS_COLLECTION_ID; // Assuming a transactions collection

interface TotalTransactionsState {
  totalTransactions: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useTotalTransactions = (collegeNameFilter?: string): TotalTransactionsState => {
  const { userProfile, isLoading: isAuthLoading } = useAuth(); // Use userProfile and isLoading
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotalTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queries = [
        collegeNameFilter ? Query.equal('collegeName', collegeNameFilter) : Query.limit(1000) // Fetch all if no filter
      ];

      const response = await databases.listDocuments(
        DATABASE_ID,
        TRANSACTIONS_COLLECTION_ID,
        queries
      );
      setTotalTransactions(response.total);
    } catch (err: any) {
      console.error("Error fetching total transactions:", err);
      setError("Failed to fetch total transactions.");
      toast.error("Failed to load transaction count.");
    } finally {
      setIsLoading(false);
    }
  }, [collegeNameFilter]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchTotalTransactions();
    }
  }, [fetchTotalTransactions, isAuthLoading]);

  return {
    totalTransactions,
    isLoading,
    error,
    refetch: fetchTotalTransactions,
  };
};