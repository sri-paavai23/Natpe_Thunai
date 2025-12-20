"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICE_REVIEWS_COLLECTION_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { ServiceReview } from './useServiceReviews'; // Import the updated ServiceReview interface

interface UserSellerRatingState {
  averageRating: number;
  totalReviews: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useUserSellerRating = (userId?: string): UserSellerRatingState => {
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSellerRating = useCallback(async () => {
    // Check for environment variable configuration
    if (APPWRITE_SERVICE_REVIEWS_COLLECTION_ID === 'YOUR_SERVICE_REVIEWS_COLLECTION_ID' || !APPWRITE_SERVICE_REVIEWS_COLLECTION_ID) {
      const msg = "APPWRITE_SERVICE_REVIEWS_COLLECTION_ID is not configured. Please set it in your .env file.";
      console.error(msg);
      setError(msg);
      setIsLoading(false);
      return;
    }

    if (isAuthLoading) {
      setIsLoading(true);
      setAverageRating(0);
      setTotalReviews(0);
      setError(null);
      return;
    }

    if (!userId) {
      setIsLoading(false);
      setAverageRating(0);
      setTotalReviews(0);
      setError("User ID is missing. Cannot fetch seller rating.");
      return;
    }
    if (!userProfile?.collegeName) {
      setIsLoading(false);
      setAverageRating(0);
      setTotalReviews(0);
      setError("User college information is missing. Cannot fetch seller rating.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICE_REVIEWS_COLLECTION_ID,
        [
          Query.equal('sellerId', userId), // Query by the new sellerId attribute
          Query.equal('collegeName', userProfile.collegeName),
          Query.limit(100) // Limit to a reasonable number of reviews
        ]
      );
      const reviews = response.documents as unknown as ServiceReview[];
      
      if (reviews.length > 0) {
        const total = reviews.reduce((sum, review) => sum + review.rating, 0);
        setAverageRating(total / reviews.length);
        setTotalReviews(reviews.length);
      } else {
        setAverageRating(0);
        setTotalReviews(0);
      }
    } catch (err: any) {
      console.error(`Error fetching seller rating for user ${userId}:`, err);
      setError(`Failed to load seller rating: ${err.message}. Please check Appwrite collection ID, permissions, and schema.`);
      toast.error(`Failed to load seller rating: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [userId, userProfile?.collegeName, isAuthLoading]);

  useEffect(() => {
    fetchSellerRating();

    if (!userId || !userProfile?.collegeName) return;

    // Subscribe to real-time updates for reviews related to this seller
    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_SERVICE_REVIEWS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as ServiceReview;
        if (payload.sellerId === userId && payload.collegeName === userProfile.collegeName) {
          // If a review for this seller is created, updated, or deleted, refetch the rating
          fetchSellerRating();
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchSellerRating, userId, userProfile?.collegeName]);

  return { averageRating, totalReviews, isLoading, error, refetch: fetchSellerRating };
};