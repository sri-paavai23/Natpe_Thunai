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
  const { userProfile } = useAuth(); // NEW: Get userProfile here
  const [foodOrdersLastWeek, setFoodOrdersLastWeek] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFoodOrdersLastWeek = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sevenDaysAgo = subDays(new Date(), 7);
      const isoDate = formatISO(sevenDaysAgo);

      const queries = [
        Query.greaterThanEqual('$createdAt', isoDate),
        Query.limit(1) // We only need the total count
      ];
      // NEW: If user is a developer, or no specific collegeNameFilter is provided, fetch all.
      // Otherwise, filter by the provided collegeNameFilter.
      if (userProfile?.role !== 'developer' && collegeNameFilter) {
        queries.push(Query.equal('collegeName', collegeNameFilter));
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
  }, [collegeNameFilter, userProfile?.role]); // NEW: Depend on userProfile.role

  useEffect(() => {
    fetchFoodOrdersLastWeek();
  }, [fetchFoodOrdersLastWeek]);

  return { foodOrdersLastWeek, isLoading, error, refetch: fetchFoodOrdersLastWeek };
};