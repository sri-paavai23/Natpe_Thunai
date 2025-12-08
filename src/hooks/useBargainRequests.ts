"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID, APPWRITE_PRODUCTS_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query, ID } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { Product } from '@/lib/mockData'; // Assuming Product interface is available

export interface BargainRequest extends Models.Document {
  productId: string;
  productTitle: string;
  originalPrice: string;
  requestedPrice: string;
  buyerId: string;
  buyerName: string;
  userId: string; // FIX: Changed from sellerId to userId
  sellerName: string;
  status: "pending" | "accepted" | "denied"; // Status of the bargain request
  collegeName: string;
}

interface UseBargainRequestsState {
  buyerRequests: BargainRequest[];
  sellerRequests: BargainRequest[];
  isLoading: boolean;
  error: string | null;
  sendBargainRequest: (product: Product, requestedPrice: number) => Promise<void>;
  updateBargainStatus: (requestId: string, newStatus: "accepted" | "denied") => Promise<void>;
  getBargainStatusForProduct: (productId: string) => { status: BargainRequest['status'] | null; requestId: string | null };
  refetch: () => void;
}

export const useBargainRequests = (): UseBargainRequestsState => {
  const { user, userProfile } = useAuth();
  const [buyerRequests, setBuyerRequests] = useState<BargainRequest[]>([]);
  const [sellerRequests, setSellerRequests] = useState<BargainRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBargainRequests = useCallback(async () => {
    if (!user?.$id || !userProfile?.collegeName) {
      setIsLoading(false);
      setBuyerRequests([]);
      setSellerRequests([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch requests made by the current user (buyer)
      const buyerResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID,
        [
          Query.equal('buyerId', user.$id),
          Query.equal('collegeName', userProfile.collegeName),
          Query.orderDesc('$createdAt'),
        ]
      );
      setBuyerRequests(buyerResponse.documents as unknown as BargainRequest[]);

      // Fetch requests received by the current user (seller)
      const sellerResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID,
        [
          Query.equal('userId', user.$id), // FIX: Use userId
          Query.equal('collegeName', userProfile.collegeName),
          Query.orderDesc('$createdAt'),
          Query.equal('status', 'pending') // Only show pending requests to seller
        ]
      );
      setSellerRequests(sellerResponse.documents as unknown as BargainRequest[]);

    } catch (err: any) {
      console.error("Error fetching bargain requests:", err);
      setError(err.message || "Failed to load bargain requests.");
      toast.error("Failed to load bargain requests.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.$id, userProfile?.collegeName]);

  useEffect(() => {
    fetchBargainRequests();

    if (!user?.$id || !userProfile?.collegeName) return;

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as BargainRequest;

        if (payload.collegeName !== userProfile.collegeName) {
          return;
        }

        // Update buyer's requests
        if (payload.buyerId === user.$id) {
          setBuyerRequests(prev => {
            const existingIndex = prev.findIndex(req => req.$id === payload.$id);
            if (response.events.includes("databases.*.collections.*.documents.*.create")) {
              if (existingIndex === -1) return [payload, ...prev];
            } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
              if (existingIndex !== -1) {
                if (payload.status === 'accepted') {
                  toast.success(`Bargain for "${payload.productTitle}" accepted! Proceed to purchase at ₹${parseFloat(payload.requestedPrice).toFixed(2)}.`);
                } else if (payload.status === 'denied') {
                  toast.info(`Bargain for "${payload.productTitle}" denied. Please reconsider as they too are students.`);
                }
                return prev.map(req => req.$id === payload.$id ? payload : req);
              }
            }
            return prev;
          });
        }

        // Update seller's requests
        if (payload.userId === user.$id) { // FIX: Use userId
          setSellerRequests(prev => {
            const existingIndex = prev.findIndex(req => req.$id === payload.$id);
            if (response.events.includes("databases.*.collections.*.documents.*.create")) {
              if (existingIndex === -1 && payload.status === 'pending') {
                toast.info(`New bargain request for "${payload.productTitle}" from ${payload.buyerName}.`);
                return [payload, ...prev];
              }
            } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
              // If status changes from pending, remove from seller's active requests
              if (existingIndex !== -1 && payload.status !== 'pending') {
                return prev.filter(req => req.$id !== payload.$id);
              }
            }
            return prev;
          });
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchBargainRequests, user?.$id, userProfile?.collegeName]);

  const sendBargainRequest = useCallback(async (product: Product, requestedPrice: number) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to send a bargain request.");
      return;
    }
    if (!userProfile.collegeName) {
      toast.error("Your profile is missing college information. Please update your profile first.");
      return;
    }

    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID,
        ID.unique(),
        {
          productId: product.$id,
          productTitle: product.title,
          originalPrice: product.price,
          requestedPrice: requestedPrice.toFixed(2),
          buyerId: user.$id,
          buyerName: user.name,
          userId: product.userId, // FIX: Use product.userId
          sellerName: product.sellerName,
          status: "pending",
          collegeName: userProfile.collegeName,
        }
      );
      toast.success(`Bargain request for ₹${requestedPrice.toFixed(2)} sent to ${product.sellerName}!`);
      fetchBargainRequests(); // Refetch to update buyerRequests state
    } catch (err: any) {
      console.error("Error sending bargain request:", err);
      toast.error(err.message || "Failed to send bargain request.");
      throw err;
    }
  }, [user, userProfile, fetchBargainRequests]);

  const updateBargainStatus = useCallback(async (requestId: string, newStatus: "accepted" | "denied") => {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID,
        requestId,
        { status: newStatus }
      );
      toast.success(`Bargain request ${newStatus}.`);
      fetchBargainRequests(); // Refetch to update sellerRequests state
    } catch (err: any) {
      console.error("Error updating bargain status:", err);
      toast.error(err.message || "Failed to update bargain status.");
      throw err;
    }
  }, [fetchBargainRequests]);

  const getBargainStatusForProduct = useCallback((productId: string) => {
    const request = buyerRequests.find(req => req.productId === productId);
    return { status: request?.status || null, requestId: request?.$id || null };
  }, [buyerRequests]);

  return {
    buyerRequests,
    sellerRequests,
    isLoading,
    error,
    sendBargainRequest,
    updateBargainStatus,
    getBargainStatusForProduct,
    refetch: fetchBargainRequests,
  };
};