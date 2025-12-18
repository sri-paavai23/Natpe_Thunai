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
      const sevenDaysAgo = subDays(new Date(), 7);
      const isoDate = formatISO(sevenDaysAgo);

      const queries = [
        Query.greaterThanEqual('$createdAt', isoDate),
      ]; 
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
  }, [collegeNameFilter, userProfile]);

  useEffect(() => {
    if (isAuthLoading) {
      setIsLoading(true);
      setFoodOrdersLastWeek(0); // Clear data while auth is loading
      setError(null);
      return;
    }

    if (userProfile === null) {
      setIsLoading(false);
      setFoodOrdersLastWeek(0);
      setError("User profile not loaded. Cannot fetch food orders analytics.");
      return;
    }

    // If auth is done and userProfile is available, fetch data
    fetchFoodOrdersLastWeek();
  }, [fetchFoodOrdersLastWeek, isAuthLoading, userProfile]);

  return { foodOrdersLastWeek, isLoading, error, refetch: fetchFoodOrdersLastWeek };
};