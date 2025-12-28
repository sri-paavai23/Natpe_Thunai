import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query, Models, ID } from 'appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

// Collection IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const SERVICE_REVIEWS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SERVICE_REVIEWS_COLLECTION_ID;

export interface ServiceReview extends Models.Document { // Extend Models.Document
  serviceId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number; // 1-5 stars
  comment: string;
  collegeName: string;
  $sequence: number; // Made $sequence required
}

interface ServiceReviewsState {
  reviews: ServiceReview[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  postReview: (reviewData: Omit<ServiceReview, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "reviewerId" | "reviewerName" | "collegeName" | "$sequence">) => Promise<void>; // Omit $sequence
}

export const useServiceReviews = (serviceId?: string): ServiceReviewsState => {
  const { user, userProfile, isLoading: isAuthLoading } = useAuth();
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queries = [
        Query.orderDesc('$createdAt'),
        serviceId ? Query.equal('serviceId', serviceId) : Query.limit(100), // Filter by serviceId if provided
        userProfile?.collegeName ? Query.equal('collegeName', userProfile.collegeName) : Query.limit(100) // Filter by college if available
      ];

      const response = await databases.listDocuments(
        DATABASE_ID,
        SERVICE_REVIEWS_COLLECTION_ID,
        queries
      );
      setReviews(response.documents as ServiceReview[]);
    } catch (err: any) {
      console.error("Error fetching service reviews:", err);
      setError("Failed to fetch service reviews.");
      toast.error("Failed to load service reviews.");
    } finally {
      setIsLoading(false);
    }
  }, [serviceId, userProfile?.collegeName]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchReviews();
    }
  }, [fetchReviews, isAuthLoading]);

  const postReview = async (reviewData: Omit<ServiceReview, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "reviewerId" | "reviewerName" | "collegeName" | "$sequence">) => {
    if (!user || !userProfile?.collegeName) {
      toast.error("You must be logged in and have a college name set to post a review.");
      return;
    }

    try {
      const newReview = await databases.createDocument(
        DATABASE_ID,
        SERVICE_REVIEWS_COLLECTION_ID,
        ID.unique(),
        {
          ...reviewData,
          reviewerId: user.$id,
          reviewerName: user.name,
          collegeName: userProfile.collegeName,
          $sequence: 0, // Provide a default for $sequence
        }
      );
      setReviews(prev => [newReview as ServiceReview, ...prev]);
      toast.success("Review posted successfully!");
    } catch (err: any) {
      console.error("Error posting review:", err);
      toast.error(err.message || "Failed to post review.");
      throw err;
    }
  };

  return {
    reviews,
    isLoading,
    error,
    refetch: fetchReviews,
    postReview,
  };
};