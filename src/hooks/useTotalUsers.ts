"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

interface TotalUsersState {
  totalUsers: number;
  isLoading: boolean;
  error: string | null;
}

export const useTotalUsers = (collegeNameFilter?: string): TotalUsersState => {
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTotalUsers = async () => {
      if (isAuthLoading) return;

      setIsLoading(true);
      setError(null);
      try {
        const queries = [];
        if (collegeNameFilter) {
          queries.push(Query.equal('collegeId', collegeNameFilter));
        }
        
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_USER_PROFILES_COLLECTION_ID,
          queries
        );
        setTotalUsers(response.total);
      } catch (err: any) {
        console.error("Failed to fetch total users:", err);
        setError(err.message || "Failed to load total users.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTotalUsers();
  }, [userProfile, isAuthLoading, collegeNameFilter]);

  return { totalUsers, isLoading, error };
};