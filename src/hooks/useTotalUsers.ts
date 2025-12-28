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

// Collection IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const USER_PREFERENCES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USER_PREFERENCES_COLLECTION_ID;

interface TotalUsersState {
  totalUsers: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useTotalUsers = (collegeNameFilter?: string): TotalUsersState => {
  const { userProfile, isLoading: isAuthLoading } = useAuth(); // Use userProfile and isLoading
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotalUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queries = [
        collegeNameFilter ? Query.equal('collegeName', collegeNameFilter) : Query.limit(1000) // Fetch all if no filter
      ];

      const response = await databases.listDocuments(
        DATABASE_ID,
        USER_PREFERENCES_COLLECTION_ID,
        queries
      );
      setTotalUsers(response.total);
    } catch (err: any) {
      console.error("Error fetching total users:", err);
      setError("Failed to fetch total users.");
      toast.error("Failed to load user count.");
    } finally {
      setIsLoading(false);
    }
  }, [collegeNameFilter]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchTotalUsers();
    }
  }, [fetchTotalUsers, isAuthLoading]);

  return {
    totalUsers,
    isLoading,
    error,
    refetch: fetchTotalUsers,
  };
};