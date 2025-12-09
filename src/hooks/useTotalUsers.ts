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
  const { userProfile, isLoading: isAuthLoading } = useAuth(); // NEW: Get isAuthLoading
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotalUsers = useCallback(async () => {
    if (isAuthLoading) { // NEW: Wait for AuthContext to load
      setIsLoading(true);
      return;
    }

    // NEW: If user is not a developer and their collegeName is not set, exit early.
    // This prevents unnecessary API calls and ensures isLoading is set to false.
    const isDeveloper = userProfile?.role === 'developer';
    const collegeToFilterBy = collegeNameFilter || userProfile?.collegeName; // Use explicit filter or user's college

    if (!isDeveloper && !collegeToFilterBy) {
      setIsLoading(false);
      setTotalUsers(0);
      setError("User profile is missing college information. Cannot fetch total users.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const queries = [Query.limit(1)]; // We only need the total count

      if (!isDeveloper && collegeToFilterBy) { // Apply collegeName filter ONLY for non-developers
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
  }, [isAuthLoading, collegeNameFilter, userProfile?.role, userProfile?.collegeName]); // NEW: Depend on isAuthLoading

  useEffect(() => {
    fetchTotalUsers();
  }, [fetchTotalUsers]);

  return { totalUsers, isLoading, error, refetch: fetchTotalUsers };
};