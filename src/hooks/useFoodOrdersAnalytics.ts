"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { toast } from 'sonner';
import { subDays, formatISO } from 'date-fns';
import { useAuth } from '@/context/AuthContext'; // NEW: Import useAuth

interface FoodOrdersAnalyticsState {
  foodOrdersLastWeek: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useFoodOrdersAnalytics = (collegeNameFilter?: string): FoodOrdersAnalyticsState => { // NEW: Renamed parameter to collegeNameFilter
  const { userProfile, isLoading: isAuthLoading } = useAuth(); // NEW: Get isAuthLoading
  const [foodOrdersLastWeek, setFoodOrdersLastWeek] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFoodOrdersLastWeek = useCallback(async () => {
    if (isAuthLoading) { // NEW: Wait for AuthContext to load
      setIsLoading(true);
      return;
    }

    // NEW: If user is not a developer and their collegeName is not set, exit early.
    // This prevents unnecessary API calls and ensures isLoading is set to false.
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
        Query.limit(1) // We only need the total count
      ];
      if (!isDeveloper && collegeToFilterBy) { // Apply collegeName filter ONLY for non-developers
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
  }, [isAuthLoading, collegeNameFilter, userProfile?.role, userProfile?.collegeName]); // NEW: Depend on isAuthLoading

  useEffect(() => {
    fetchFoodOrdersLastWeek();
  }, [fetchFoodOrdersLastWeek]);

  return { foodOrdersLastWeek, isLoading, error, refetch: fetchFoodOrdersLastWeek };
};