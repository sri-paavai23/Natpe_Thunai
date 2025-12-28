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
    // If userProfile is not yet loaded or is null, we can't fetch.
    // The useEffect below will handle setting isLoading to false and error if userProfile is null.
    if (!userProfile) {
      return;
    }

    const isDeveloper = userProfile.role === 'developer';
    const collegeToFilterBy = collegeNameFilter || userProfile.collegeName;

    setIsLoading(true);
    setError(null);
    try {
      const queries = []; 

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
  }, [collegeNameFilter, userProfile]);

  useEffect(() => {
    if (isAuthLoading) {
      setIsLoading(true);
      setTotalUsers(0); // Clear data while auth is loading
      setError(null);
      return;
    }

    if (userProfile === null) {
      setIsLoading(false);
      setTotalUsers(0);
      setError("User profile not loaded. Cannot fetch total users.");
      return;
    }

    // If auth is done and userProfile is available, fetch data
    fetchTotalUsers();
  }, [fetchTotalUsers, isAuthLoading, userProfile]);

  return { totalUsers, isLoading, error, refetch: fetchTotalUsers };
};