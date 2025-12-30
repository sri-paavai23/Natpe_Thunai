import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { subDays, formatISO } from 'date-fns';

interface FoodOrdersAnalyticsState {
  foodOrdersLastWeek: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useFoodOrdersAnalytics = (collegeNameFilter?: string): FoodOrdersAnalyticsState => {
  const { userProfile, loading: isAuthLoading } = useAuth(); // Corrected 'isLoading' to 'loading'
  const [foodOrdersLastWeek, setFoodOrdersLastWeek] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFoodOrdersAnalytics = useCallback(async () => {
    if (isAuthLoading) return;

    setIsLoading(true);
    setError(null);
    try {
      const sevenDaysAgo = formatISO(subDays(new Date(), 7));
      let queries = [
        Query.greaterThanEqual('$createdAt', sevenDaysAgo),
        Query.limit(0) // We only need the total count
      ];

      // If a collegeNameFilter is provided, use it.
      // If user is a developer, they can see all orders (collegeNameFilter would be undefined).
      // If user is not a developer, filter by their collegeName if no explicit filter is provided.
      if (collegeNameFilter) {
        queries.push(Query.equal('collegeName', collegeNameFilter));
      } else if (userProfile?.role !== 'developer' && userProfile?.collegeName) { // Corrected userType to role
        queries.push(Query.equal('collegeName', userProfile.collegeName));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        queries
      );
      setFoodOrdersLastWeek(response.total);
    } catch (err: any) {
      console.error("Error fetching food orders analytics:", err);
      setError(err.message || "Failed to fetch food orders analytics.");
      setFoodOrdersLastWeek(0);
    } finally {
      setIsLoading(false);
    }
  }, [collegeNameFilter, userProfile?.collegeName, userProfile?.role, isAuthLoading]); // Added userProfile.role to dependencies

  useEffect(() => {
    fetchFoodOrdersAnalytics();
  }, [fetchFoodOrdersAnalytics]);

  return { foodOrdersLastWeek, isLoading, error, refetch: fetchFoodOrdersAnalytics };
};