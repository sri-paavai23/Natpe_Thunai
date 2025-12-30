"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query, ID } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
// Removed specific Product import to make it generic
// import { Product } from '@/lib/mockData'; 

export interface BargainRequest extends Models.Document {
  productId: string; // Acts as the generic Listing ID (Service ID or Product ID)
  productTitle: string;
  originalPrice: string;
  requestedPrice: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  status: "pending" | "accepted" | "denied";
  collegeName: string;
}

// NEW: Generic interface for any item that can be bargained (Product or Service)
export interface BargainableItem {
  $id: string;
  title: string;
  userId: string; // For Services, map 'posterId' to this. For Products, use 'userId'.
  sellerName: string; // For Services, map 'posterName' to this.
  price: string;
}

interface UseBargainRequestsState {
  buyerRequests: BargainRequest[];
  sellerRequests: BargainRequest[];
  isLoading: boolean;
  error: string | null;
  sendBargainRequest: (item: BargainableItem, requestedPrice: number) => Promise<void>;
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

      const sellerResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID,
        [
          Query.equal('sellerId', user.$id),
          Query.equal('collegeName', userProfile.collegeName),
          Query.orderDesc('$createdAt'),
          Query.equal('status', 'pending')
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

        if (payload.sellerId === user.$id) {
          setSellerRequests(prev => {
            const existingIndex = prev.findIndex(req => req.$id === payload.$id);
            if (response.events.includes("databases.*.collections.*.documents.*.create")) {
              if (existingIndex === -1 && payload.status === 'pending') {
                toast.info(`New bargain request for "${payload.productTitle}" from ${payload.buyerName}.`);
                return [payload, ...prev];
              }
            } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
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

  // UPDATED: Now accepts BargainableItem (Generic) instead of just Product
  const sendBargainRequest = useCallback(async (item: BargainableItem, requestedPrice: number) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to send a bargain request.");
      return;
    }
    if (!userProfile.collegeName) {
      toast.error("Your profile is missing college information. Please update your profile first.");
      return;
    }
    if (!item.userId || item.userId.trim() === "") {
      toast.error("Seller information is missing or invalid. Cannot send bargain request.");
      console.error("Seller ID is missing or empty for item:", item);
      return;
    }

    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID,
        ID.unique(),
        {
          productId: item.$id, // This stores either productID OR serviceID
          productTitle: item.title,
          originalPrice: item.price,
          requestedPrice: requestedPrice.toFixed(2),
          buyerId: user.$id,
          buyerName: user.name,
          sellerId: item.userId, 
          sellerName: item.sellerName,
          status: "pending",
          collegeName: userProfile.collegeName,
          // Optional: Add a 'type' field ('product' | 'service') to your database collection if you want to distinguish later
          // type: 'service' | 'product' 
        }
      );
      toast.success(`Bargain request for ₹${requestedPrice.toFixed(2)} sent to ${item.sellerName}!`);
      fetchBargainRequests();
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
      fetchBargainRequests();
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