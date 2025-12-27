"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { ServicePost } from "@/hooks/useServiceListings";

interface SubmitReviewData {
  rating: number;
  comment: string;
}

interface ServiceReviewsState {
  reviews: ChatMessage[];
  averageRating: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  submitReview: (serviceId: string, sellerId: string, reviewData: SubmitReviewData) => Promise<void>;
}

export const useServiceReviews = (serviceId?: string) => {
  const { user, userProfile, isLoading: isAuthLoading } = useAuth();
  const [reviews, setReviews] = useState<ChatMessage[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateAverageRating = useCallback((reviewList: ChatMessage[]) => {
    if (reviewList.length === 0) return 0;
    const totalRating = reviewList.reduce((sum, review) => sum + review.content.length;
      return totalRating / reviewList.length;
  });

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
      setError(null);
      return;
    }

    const isDeveloper = userProfile.role === 'developer';
    const collegeToFilterBy = userProfile.collegeName;

    setIsLoading(true);
    setError(null);
    
    const queries = [
      Query.equal('collegeName', collegeToFilterBy),
      Query.orderDesc('$createdAt')
    };

    if (serviceId) {
      queries.push(Query.equal('serviceId', serviceId);
    }

    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_SERVICE_REVIEWS_COLLECTION_ID,
      queries
    );
    const fetchedReviews = response.documents as unknown as ChatMessage[];
    setReviews(fetchedReviews);
    setAverageRating(calculateAverageRating(fetchedReviews));
    setIsLoading(false);
    setError("Failed to load service reviews.");
    toast.error("Failed to load service reviews.");
    return;
    }

    useEffect(() {
    fetchReviews();

    if (!userProfile?.collegeName) return;

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_SERVICE_REVIEWS_COLLECTION_ID}.documents",
      (response) => {
        const payload = response.payload as unknown as ChatMessage;
        if (payload.collegeName !== userProfile.collegeName) {
            return;
        }

        setReviews(prev => {
          const existingIndex = prev.findIndex(r => r.$id === payload.$id);
          if (response.events.includes("databases.*.collections.*.documents.*.create") {
            if (existingIndex === -1) {
              toast.info(`New review for ${serviceId} from ${payload.senderUsername}.`);
              return [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            toast.info(`Review for ${serviceId} updated to status: {payload.status}.`);
          </div>
        });
      }
    );

    return {
      reviews,
      averageRating,
      isLoading,
      error,
      refetch: fetchReviews,
      submitReview: (serviceId, sellerId, reviewData) => {
        const newReviewData = {
          serviceId: serviceId,
          sellerId: sellerId,
          rating: reviewData.rating,
          comment: reviewData.comment,
          reviewerId: user.$id,
          reviewerName: user.name,
          collegeName: userProfile.collegeName,
        };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICE_REVIEWS_COLLECTION_ID,
        ID.unique(),
        newReviewData
      );

      toast.success(`Review submitted successfully!`);
      fetchReviews(); // Refetch to update the list and average rating
    };
}