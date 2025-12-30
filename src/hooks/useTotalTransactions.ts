import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

interface TotalTransactionsState {
  totalTransactions: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useTotalTransactions = (collegeNameFilter?: string): TotalTransactionsState => {
  const { userProfile, loading: isAuthLoading } = useAuth(); // Corrected 'isLoading' to 'loading'
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotalTransactions = useCallback(async () => {
    if (isAuthLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      let queries = [
        Query.limit(0) // We only need the total count
      ];

      // If a collegeNameFilter is provided, use it.
      // If user is a developer, they can see all transactions (collegeNameFilter would be undefined).
      // If user is not a developer, filter by their collegeName if no explicit filter is provided.
      if (collegeNameFilter) {
        queries.push(Query.equal('collegeName', collegeNameFilter));
      } else if (userProfile?.role !== 'developer' && userProfile?.collegeName) { // Corrected userType to role
        queries.push(Query.equal('collegeName', userProfile.collegeName));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        queries
      );
      setTotalTransactions(response.total);
    } catch (err: any) {
      console.error("Error fetching total transactions:", err);
      setError(err.message || "Failed to fetch total transactions.");
      setTotalTransactions(0);
    } finally {
      setIsLoading(false);
    }
  }, [collegeNameFilter, userProfile?.collegeName, userProfile?.role, isAuthLoading]); // Added userProfile.role to dependencies

  useEffect(() => {
    fetchTotalTransactions();
  }, [fetchTotalTransactions]);

  return { totalTransactions, isLoading, error, refetch: fetchTotalTransactions };
};