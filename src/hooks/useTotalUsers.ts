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

export const useTotalUsers = (collegeNameFilter?: string): TotalUsersState => {
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotalUsers = useCallback(async () => {
    if (isAuthLoading || userProfile === null) {
      setIsLoading(true); // Keep loading true while auth is resolving
      return;
    }

    const isDeveloper = userProfile?.role === 'developer';
    const collegeToFilterBy = collegeNameFilter || userProfile?.collegeName;

    if (!isDeveloper && !collegeToFilterBy) {
      setIsLoading(false);
      setTotalUsers(0);
      setError("User profile is missing college information. Cannot fetch total users.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const queries = []; // Removed Query.limit(1)

      if (!isDeveloper && collegeToFilterBy) {
        queries.push(Query.equal('collegeName', collegeToFilterBy));
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
  }, [isAuthLoading, collegeNameFilter, userProfile]);

  useEffect(() => {
    if (!isAuthLoading && userProfile !== null) {
      fetchTotalUsers();
    }
    if (isAuthLoading || userProfile === null) {
        setIsLoading(true);
    }
  }, [fetchTotalUsers, isAuthLoading, userProfile]);

  return { totalUsers, isLoading, error, refetch: fetchTotalUsers };
};