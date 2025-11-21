"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { toast } from 'sonner';

interface TotalUsersState {
  totalUsers: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useTotalUsers = (): TotalUsersState => {
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTotalUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.limit(1)] // We only need the total count, not all documents
      );
      setTotalUsers(response.total);
    } catch (err: any) {
      console.error("Error fetching total users:", err);
      setError(err.message || "Failed to load total users.");
      toast.error("Failed to load total users for analytics.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTotalUsers();

    // Optional: Subscribe to real-time updates for user profiles if you want the count to update live
    // For a dashboard, a periodic refetch might be sufficient, or subscribe to 'create'/'delete' events.
    // For simplicity, we'll rely on manual refetch or component remount for now.

  }, [fetchTotalUsers]);

  return { totalUsers, isLoading, error, refetch: fetchTotalUsers };
};