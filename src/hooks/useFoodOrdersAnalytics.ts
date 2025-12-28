import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query } from 'appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { subDays, formatISO } from 'date-fns';

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

// Collection IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const FOOD_ORDERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_FOOD_ORDERS_COLLECTION_ID;

interface FoodOrdersAnalyticsState {
  foodOrdersLastWeek: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useFoodOrdersAnalytics = (collegeNameFilter?: string): FoodOrdersAnalyticsState => {
  const { userProfile, isLoading: isAuthLoading } = useAuth(); // Use userProfile and isLoading
  const [foodOrdersLastWeek, setFoodOrdersLastWeek] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFoodOrdersAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sevenDaysAgo = formatISO(subDays(new Date(), 7));

      const queries = [
        Query.greaterThan('$createdAt', sevenDaysAgo),
        collegeNameFilter ? Query.equal('collegeName', collegeNameFilter) : Query.limit(1000) // Fetch all if no filter
      ];

      const response = await databases.listDocuments(
        DATABASE_ID,
        FOOD_ORDERS_COLLECTION_ID,
        queries
      );
      setFoodOrdersLastWeek(response.total);
    } catch (err: any) {
      console.error("Error fetching food orders analytics:", err);
      setError("Failed to fetch food orders analytics.");
      toast.error("Failed to load food orders analytics.");
    } finally {
      setIsLoading(false);
    }
  }, [collegeNameFilter]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchFoodOrdersAnalytics();
    }
  }, [fetchFoodOrdersAnalytics, isAuthLoading]);

  return {
    foodOrdersLastWeek,
    isLoading,
    error,
    refetch: fetchFoodOrdersAnalytics,
  };
};