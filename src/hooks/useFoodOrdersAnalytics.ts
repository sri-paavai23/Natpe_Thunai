"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { subDays, formatISO } from 'date-fns';

interface FoodOrdersAnalyticsState {
  foodOrdersLastWeek: number;
  isLoading: boolean;
  error: string | null;
}

export const useFoodOrdersAnalytics = (collegeNameFilter?: string): FoodOrdersAnalyticsState => {
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  const [foodOrdersLastWeek, setFoodOrdersLastWeek] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFoodOrdersAnalytics = async () => {
      if (isAuthLoading) return;

      setIsLoading(true);
      setError(null);
      try {
        const sevenDaysAgo = formatISO(subDays(new Date(), 7));
        const queries = [
          Query.greaterThan('$createdAt', sevenDaysAgo),
        ];

        if (collegeNameFilter) {
          queries.push(Query.search('servedCollegeIds', collegeNameFilter));
        }
        
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_FOOD_ORDERS_COLLECTION_ID,
          queries
        );
        setFoodOrdersLastWeek(response.total);
      } catch (err: any) {
        console.error("Failed to fetch food orders analytics:", err);
        setError(err.message || "Failed to load food orders analytics.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFoodOrdersAnalytics();
  }, [userProfile, isAuthLoading, collegeNameFilter]);

  return { foodOrdersLastWeek, isLoading, error };
};