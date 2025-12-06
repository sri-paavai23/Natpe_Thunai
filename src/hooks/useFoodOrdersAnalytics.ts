"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { toast } from 'sonner';
import { subDays, formatISO } from 'date-fns';

interface FoodOrdersAnalyticsState {
  foodOrdersLastWeek: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useFoodOrdersAnalytics = (collegeName?: string): FoodOrdersAnalyticsState => { // NEW: Add collegeName parameter
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
      if (collegeName) { // NEW: Apply collegeName filter if provided
        queries.push(Query.equal('collegeName', collegeName));
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
  }, [collegeName]); // NEW: Depend on collegeName

  useEffect(() => {
    fetchFoodOrdersLastWeek();
  }, [fetchFoodOrdersLastWeek]);

  return { foodOrdersLastWeek, isLoading, error, refetch: fetchFoodOrdersLastWeek };
};