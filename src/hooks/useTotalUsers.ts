import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

interface TotalUsersState {
  totalUsers: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useTotalUsers = (collegeNameFilter?: string): TotalUsersState => {
  const { userProfile, loading: isAuthLoading } = useAuth(); // Corrected 'isLoading' to 'loading'
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotalUsers = useCallback(async () => {
    if (isAuthLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      let queries = [];

      // If a collegeNameFilter is provided, use it.
      // If user is a developer, they can see all users (collegeNameFilter would be undefined).
      // If user is not a developer, filter by their collegeName if no explicit filter is provided.
      if (collegeNameFilter) {
        queries.push(Query.equal('collegeName', collegeNameFilter));
      } else if (userProfile?.role !== 'developer' && userProfile?.collegeName) { // Corrected userType to role
        queries.push(Query.equal('collegeName', userProfile.collegeName));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        queries
      );
      setTotalUsers(response.total);
    } catch (err: any) {
      console.error("Error fetching total users:", err);
      setError(err.message || "Failed to fetch total users.");
      setTotalUsers(0);
    } finally {
      setIsLoading(false);
    }
  }, [collegeNameFilter, userProfile?.collegeName, userProfile?.role, isAuthLoading]); // Added userProfile.role to dependencies

  useEffect(() => {
    fetchTotalUsers();
  }, [fetchTotalUsers]);

  return { totalUsers, isLoading, error, refetch: fetchTotalUsers };
};