import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICE_REVIEWS_COLLECTION_ID, client } from '@/lib/appwrite'; // Added client for subscribe
import { Models, Query, ID } from 'appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface ServiceReview extends Models.Document {
  serviceId: string;
  reviewerId: string;
  reviewerName: string;
  collegeName: string;
  rating: number; // 1-5
  comment: string;
  $createdAt: string;
}

interface ServiceReviewsState {
  reviews: ServiceReview[];
  averageRating: number;
  isLoading: boolean;
  error: string | null;
  addReview: (serviceId: string, rating: number, comment: string) => Promise<void>;
  refetch: () => void;
}

export const useServiceReviews = (serviceId?: string): ServiceReviewsState => {
  const { user, userProfile, loading: isAuthLoading } = useAuth(); // Corrected 'isLoading' to 'loading'
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateAverageRating = useCallback((currentReviews: ServiceReview[]) => {
    if (currentReviews.length === 0) return 0;
    const totalRating = currentReviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / currentReviews.length;
  }, []);

  const fetchReviews = useCallback(async () => {
    if (isAuthLoading) return;

    setIsLoading(true);
    setError(null);

    if (!serviceId) {
      setIsLoading(false);
      setReviews([]);
      setAverageRating(0);
      return;
    }

    if (!userProfile?.collegeName) { // Only fetch if collegeName is available
      setIsLoading(false);
      setReviews([]);
      setAverageRating(0);
      return;
    }

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
      const fetchedReviews = response.documents as unknown as ServiceReview[]; // Cast to unknown first
      setReviews(fetchedReviews);
      setAverageRating(calculateAverageRating(fetchedReviews));
    } catch (err: any) {
      console.error("Error fetching service reviews:", err);
      setError(err.message || "Failed to fetch service reviews.");
      setReviews([]);
      setAverageRating(0);
    } finally {
      setIsLoading(false);
    }
  }, [serviceId, userProfile?.collegeName, calculateAverageRating, isAuthLoading]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const addReview = useCallback(async (serviceId: string, rating: number, comment: string) => {
    if (!user?.$id || !user?.name || !userProfile?.collegeName) {
      toast.error("You must be logged in and have college information to add a review.");
      return;
    }
    if (!serviceId) {
      toast.error("Service ID is missing.");
      return;
    }

    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICE_REVIEWS_COLLECTION_ID,
        ID.unique(),
        {
          serviceId,
          reviewerId: user.$id,
          reviewerName: user.name,
          collegeName: userProfile.collegeName,
          rating,
          comment,
        }
      );
      toast.success("Review added successfully!");
      fetchReviews(); // Refetch to update list and average rating
    } catch (err: any) {
      console.error("Error adding review:", err);
      toast.error(err.message || "Failed to add review.");
    }
  }, [user?.$id, user?.name, userProfile?.collegeName, fetchReviews]);

  // Real-time subscription
  useEffect(() => {
    if (!serviceId || !userProfile?.collegeName) return;

    const unsubscribe = client.subscribe( // Corrected to client.subscribe
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_SERVICE_REVIEWS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as ServiceReview; // Cast to unknown first
        if (payload.serviceId !== serviceId || payload.collegeName !== userProfile.collegeName) {
          return; // Only process updates for the specific service and college
        }

        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          setReviews(prev => {
            const newReviews = [...prev, payload];
            setAverageRating(calculateAverageRating(newReviews));
            return newReviews;
          });
        } else if (response.events.includes('databases.*.collections.*.documents.*.update')) {
          setReviews(prev => {
            const newReviews = prev.map(r => r.$id === payload.$id ? payload : r);
            setAverageRating(calculateAverageRating(newReviews));
            return newReviews;
          });
        } else if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
          setReviews(prev => {
            const newReviews = prev.filter(r => r.$id !== payload.$id);
            setAverageRating(calculateAverageRating(newReviews));
            return newReviews;
          });
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchReviews, serviceId, userProfile?.collegeName, calculateAverageRating]);

  return {
    reviews,
    averageRating,
    isLoading,
    error,
    addReview,
    refetch: fetchReviews,
  };
};