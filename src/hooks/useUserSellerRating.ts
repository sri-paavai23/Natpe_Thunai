"use client";

import { useState, useEffect } from 'react';
// In a real application, you would import your backend client (e.g., Appwrite) here
// import { databases, Query, APPWRITE_DATABASE_ID, APPWRITE_REVIEWS_COLLECTION_ID } from '@/lib/appwrite';

/**
 * Custom hook to fetch a user's seller rating and total reviews.
 * Defaults to 1.0 rating and 0 reviews if no data is found or on error.
 *
 * @param userId The ID of the user whose seller rating is to be fetched.
 */
export const useUserSellerRating = (userId: string | undefined) => {
  const [averageRating, setAverageRating] = useState(1.0); // Default to 1.0
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRating = async () => {
      if (!userId) {
        // If no user ID, set default values and stop loading
        setAverageRating(1.0);
        setTotalReviews(0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // --- MOCK DATA FETCHING ---
        // In a real application, you would fetch actual reviews from your database.
        // For example, using Appwrite:
        /*
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_REVIEWS_COLLECTION_ID,
          [Query.equal('sellerId', userId)] // Assuming reviews are linked to a sellerId
        );
        const reviews = response.documents;
        */

        // For demonstration, let's simulate some data:
        // 50% chance of having reviews, otherwise it will default to 1.0 (0 reviews)
        const hasReviews = Math.random() > 0.5; 
        let fetchedReviewsCount = 0;
        let sumRatings = 0;

        if (hasReviews) {
          fetchedReviewsCount = Math.floor(Math.random() * 10) + 1; // Simulate 1 to 10 reviews
          for (let i = 0; i < fetchedReviewsCount; i++) {
            sumRatings += Math.random() * 4 + 1; // Simulate random rating between 1 and 5
          }
        }

        if (fetchedReviewsCount > 0) {
          setAverageRating(sumRatings / fetchedReviewsCount);
          setTotalReviews(fetchedReviewsCount);
        } else {
          // If no reviews are found, explicitly set to default
          setAverageRating(1.0);
          setTotalReviews(0);
        }

      } catch (err) {
        console.error("Failed to fetch seller rating:", err);
        setError("Failed to load rating");
        // On error, also default to 1.0 rating and 0 reviews
        setAverageRating(1.0);
        setTotalReviews(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRating();
  }, [userId]); // Re-run effect if userId changes

  return { averageRating, totalReviews, isLoading, error };
};