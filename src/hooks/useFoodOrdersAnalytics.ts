"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { toast } from 'sonner';
import { subDays, formatISO } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

interface FoodOrdersAnalyticsState {
  foodOrdersLastWeek: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useFoodOrdersAnalytics = (collegeNameFilter?: string): FoodOrdersAnalyticsState => {
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  const [foodOrdersLastWeek, setFoodOrdersLastWeek] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFoodOrdersLastWeek = useCallback(async () => {
    if (isAuthLoading || userProfile === null) {
      setIsLoading(true); // Keep loading true while auth is resolving
      return;
    }

    const isDeveloper = userProfile?.role === 'developer';
    const collegeToFilterBy = collegeNameFilter || userProfile?.collegeName;

    if (!isDeveloper && !collegeToFilterBy) {
      setIsLoading(false);
      setFoodOrdersLastWeek(0);
      setError("User profile is missing college information. Cannot fetch food orders analytics.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const sevenDaysAgo = subDays(new Date(), 7);
      const isoDate = formatISO(sevenDaysAgo);

      const queries = [
        Query.greaterThanEqual('$createdAt', isoDate),
      ]; // Removed Query.limit(1)
      if (!isDeveloper && collegeToFilterBy) {
        queries.push(Query.equal('collegeName', collegeToFilterBy));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        queries
      );
      setFoodOrdersLastWeek(response.total);
    } catch (err: any) {
      console.error("Error fetching food orders last week:", err);
      setError(err.message || "Failed to load food orders analytics.");
      toast.error("Failed to load food orders analytics.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthLoading, collegeNameFilter, userProfile]);

  useEffect(() => {
    if (!isAuthLoading && userProfile !== null) {
      fetchFoodOrdersLastWeek();
    }
    if (isAuthLoading || userProfile === null) {
        setIsLoading(true);
    }
  }, [fetchFoodOrdersLastWeek, isAuthLoading, userProfile]);

  return { foodOrdersLastWeek, isLoading, error, refetch: fetchFoodOrdersLastWeek };
};