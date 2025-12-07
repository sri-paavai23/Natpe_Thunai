"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface TotalUsersState {
  totalUsers: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useTotalUsers = (collegeNameFilter?: string): TotalUsersState => { // NEW: Renamed parameter to collegeNameFilter
  const { userProfile } = useAuth(); // NEW: Get userProfile here
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotalUsers = useCallback(async () => {
    // NEW: If user is not a developer and their collegeName is not set, exit early.
    // This prevents unnecessary API calls and ensures isLoading is set to false.
    if (userProfile?.role !== 'developer' && !userProfile?.collegeName) {
      setIsLoading(false);
      setTotalUsers(0);
      return;
    }

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
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        queries
      );
      setTotalUsers(response.total);
    } catch (err: any) {
      console.error("Error fetching total users:", err);
      setError(err.message || "Failed to load total users for analytics.");
      toast.error("Failed to load total users for analytics.");
    } finally {
      setIsLoading(false);
    }
  }, [collegeNameFilter, userProfile?.role, userProfile?.collegeName]); // NEW: Depend on userProfile.collegeName

  useEffect(() => {
    fetchTotalUsers();
  }, [fetchTotalUsers]);

  return { totalUsers, isLoading, error, refetch: fetchTotalUsers };
};