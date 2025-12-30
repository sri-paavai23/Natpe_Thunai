"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICE_REVIEWS_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query, ID } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export interface ServiceReview extends Models.Document {
  serviceId: string;
  sellerId: string; // NEW: Added sellerId
  reviewerId: string;
  reviewerName: string;
  rating: number; // 1-5 stars
  comment: string;
  collegeName: string;
}

interface SubmitReviewData {
  rating: number;
  comment: string;
}

interface ServiceReviewsState {
  reviews: ServiceReview[];
  averageRating: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  submitReview: (serviceId: string, sellerId: string, reviewData: SubmitReviewData) => Promise<void>; // NEW: Added sellerId to submitReview
}

export const useServiceReviews = (serviceId?: string): ServiceReviewsState => {
  const { user, userProfile, isLoading: isAuthLoading } = useAuth();
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateAverageRating = useCallback((reviewList: ServiceReview[]) => {
    if (reviewList.length === 0) return 0;
    const totalRating = reviewList.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / reviewList.length;
  }, []);

  const fetchReviews = useCallback(async () => {
    // Check for environment variable configuration
    if (APPWRITE_SERVICE_REVIEWS_COLLECTION_ID === 'YOUR_SERVICE_REVIEWS_COLLECTION_ID' || !APPWRITE_SERVICE_REVIEWS_COLLECTION_ID) {
      const msg = "APPWRITE_SERVICE_REVIEWS_COLLECTION_ID is not configured. Please set it in your .env file.";
      console.error(msg);
      setError(msg);
      setIsLoading(false);
      return;
    }

    // Wait for auth to load and userProfile to be available
    if (isAuthLoading) {
      setIsLoading(true);
      setReviews([]);
      setAverageRating(0);
      setError(null);
      return;
    }

    if (!serviceId) {
      setIsLoading(false);
      setReviews([]);
      setAverageRating(0);
      setError("Service ID is missing. Cannot fetch reviews.");
      return;
    }
    if (!userProfile?.collegeName) {
      setIsLoading(false);
      setReviews([]);
      setAverageRating(0);
      setError("User college information is missing. Cannot fetch reviews.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICE_REVIEWS_COLLECTION_ID,
        [
          Query.equal('serviceId', serviceId),
          Query.equal('collegeName', userProfile.collegeName),
          Query.orderDesc('$createdAt')
        ]
      );
      const fetchedReviews = response.documents as unknown as ServiceReview[];
      setReviews(fetchedReviews);
      setAverageRating(calculateAverageRating(fetchedReviews));
    } catch (err: any) {
      console.error("Error fetching service reviews:", err);
      setError(`Failed to load service reviews: ${err.message}. Please check Appwrite collection ID, permissions, and schema.`);
      toast.error(`Failed to load service reviews: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [serviceId, userProfile?.collegeName, calculateAverageRating, isAuthLoading]);

  const submitReview = useCallback(async (serviceId: string, sellerId: string, reviewData: SubmitReviewData) => { // NEW: Added sellerId
    if (!user || !userProfile || !serviceId || !sellerId) { // NEW: Check sellerId
      toast.error("You must be logged in, select a service, and have seller info to submit a review.");
      return;
    }
    if (!userProfile.collegeName) {
      toast.error("Your profile is missing college information. Please update your profile first.");
      return;
    }

    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICE_REVIEWS_COLLECTION_ID,
        ID.unique(),
        {
          ...reviewData,
          serviceId: serviceId,
          sellerId: sellerId, // NEW: Include sellerId
          reviewerId: user.$id,
          reviewerName: user.name,
          collegeName: userProfile.collegeName,
        }
      );
      toast.success("Review submitted successfully!");
      fetchReviews(); // Refetch to update the list and average rating
    } catch (err: any) {
      console.error("Error submitting review:", err);
      toast.error(err.message || "Failed to submit review.");
      throw err;
    }
  }, [user, userProfile, fetchReviews]);

  useEffect(() => {
    fetchReviews();

    if (!serviceId || !userProfile?.collegeName) return;

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_SERVICE_REVIEWS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as ServiceReview;

        if (payload.serviceId !== serviceId || payload.collegeName !== userProfile.collegeName) {
          return;
        }

        setReviews(prev => {
          let updatedReviews = prev;
          const existingIndex = prev.findIndex(r => r.$id === payload.$id);

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1) {
              toast.info(`New review for ${serviceId}.`);
              updatedReviews = [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              updatedReviews = prev.map(r => r.$id === payload.$id ? payload : r);
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            if (existingIndex !== -1) {
              updatedReviews = prev.filter(r => r.$id !== payload.$id);
            }
          }
          setAverageRating(calculateAverageRating(updatedReviews));
          return updatedReviews;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchReviews, serviceId, userProfile?.collegeName, calculateAverageRating]);

  return { reviews, averageRating, isLoading, error, refetch: fetchReviews, submitReview };
};