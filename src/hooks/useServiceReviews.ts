"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICE_REVIEWS_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query, ID } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export interface ServiceReview extends Models.Document {
  serviceId: string;
  reviewerId: string;
  reviewerName: string;
  collegeName: string;
  rating: number; // 1-5 stars
  comment: string;
  providerId: string; // ID of the service provider
}

export const useServiceReviews = (serviceId?: string) => {
  const { user, userProfile } = useAuth();
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    if (!userProfile?.collegeName) {
      setIsLoading(false);
      setError("User college information not available.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const queries = [
        Query.equal("collegeName", userProfile.collegeName),
        Query.orderDesc("$createdAt"),
      ];

      if (serviceId) {
        queries.push(Query.equal("serviceId", serviceId));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICE_REVIEWS_COLLECTION_ID,
        queries
      );
      setReviews(response.documents as unknown as ServiceReview[]);
    } catch (err: any) {
      console.error("Error fetching service reviews:", err);
      setError(err.message || "Failed to fetch service reviews.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName, serviceId]);

  useEffect(() => {
    fetchReviews();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_SERVICE_REVIEWS_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          setReviews((prev) => [response.payload as unknown as ServiceReview, ...prev]);
        } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          setReviews((prev) =>
            prev.map((review) =>
              review.$id === (response.payload as ServiceReview).$id
                ? (response.payload as unknown as ServiceReview)
                : review
            )
          );
        } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
          setReviews((prev) =>
            prev.filter((review) => review.$id !== (response.payload as ServiceReview).$id)
          );
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchReviews]);

  const addReview = async (reviewData: Omit<ServiceReview, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "reviewerId" | "reviewerName" | "collegeName">) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to add a review.");
      return;
    }
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICE_REVIEWS_COLLECTION_ID,
        ID.unique(),
        { ...reviewData, reviewerId: user.$id, reviewerName: user.name, collegeName: userProfile.collegeName }
      );
      toast.success("Review added successfully!");
    } catch (err: any) {
      console.error("Error adding review:", err);
      toast.error(err.message || "Failed to add review.");
    }
  };

  const updateReview = async (reviewId: string, reviewData: Partial<ServiceReview>) => {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICE_REVIEWS_COLLECTION_ID,
        reviewId,
        reviewData
      );
      toast.success("Review updated successfully!");
    } catch (err: any) {
      console.error("Error updating review:", err);
      toast.error(err.message || "Failed to update review.");
    }
  };

  const deleteReview = async (reviewId: string) => {
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICE_REVIEWS_COLLECTION_ID,
        reviewId
      );
      toast.success("Review deleted successfully!");
    } catch (err: any) {
      console.error("Error deleting review:", err);
      toast.error(err.message || "Failed to delete review.");
    }
  };

  return {
    reviews,
    isLoading,
    error,
    refetchReviews: fetchReviews,
    addReview,
    updateReview,
    deleteReview,
  };
};