"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID, APPWRITE_MARKETPLACE_COLLECTION_ID } from '@/lib/appwrite'; // Corrected APPWRITE_PRODUCTS_COLLECTION_ID to APPWRITE_MARKETPLACE_COLLECTION_ID
import { Models, Query, ID } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export interface BargainRequest extends Models.Document {
  serviceId: string; // Or productId for marketplace items
  serviceTitle: string;
  originalPrice: string;
  bargainPrice: string;
  message?: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  sellerUpiId?: string;
  buyerUpiId?: string;
  collegeName: string;
}

export const useBargainRequests = () => {
  const { user, userProfile } = useAuth();
  const [bargainRequests, setBargainRequests] = useState<BargainRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBargainRequests = useCallback(async () => {
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
        Query.or([
          Query.equal("buyerId", user?.id),
          Query.equal("sellerId", user?.id),
        ]),
      ];

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID,
        queries
      );
      setBargainRequests(response.documents as unknown as BargainRequest[]);
    } catch (err: any) {
      console.error("Error fetching bargain requests:", err);
      setError(err.message || "Failed to fetch bargain requests.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName, user?.id]);

  useEffect(() => {
    fetchBargainRequests();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          setBargainRequests((prev) => [response.payload as unknown as BargainRequest, ...prev]);
        } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          setBargainRequests((prev) =>
            prev.map((req) =>
              req.$id === (response.payload as BargainRequest).$id
                ? (response.payload as unknown as BargainRequest)
                : req
            )
          );
        } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
          setBargainRequests((prev) =>
            prev.filter((req) => req.$id !== (response.payload as BargainRequest).$id)
          );
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchBargainRequests]);

  const sendBargainRequest = async (requestData: Omit<BargainRequest, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "status">) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to send a bargain request.");
      return;
    }
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID,
        ID.unique(),
        { ...requestData, buyerId: user.$id, buyerName: user.name, collegeName: userProfile.collegeName, status: "pending" }
      );
      toast.success("Bargain request sent!");
    } catch (err: any) {
      console.error("Error sending bargain request:", err);
      toast.error(err.message || "Failed to send bargain request.");
    }
  };

  const updateBargainRequestStatus = async (requestId: string, status: BargainRequest["status"]) => {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID,
        requestId,
        { status }
      );
      toast.success(`Bargain request ${requestId} status updated to ${status}!`);
    } catch (err: any) {
      console.error("Error updating bargain request status:", err);
      toast.error(err.message || "Failed to update bargain request status.");
    }
  };

  const getBargainStatusForProduct = useCallback((productId: string) => {
    return bargainRequests.find(req => req.serviceId === productId && req.buyerId === user?.$id);
  }, [bargainRequests, user?.$id]);

  return {
    bargainRequests,
    isLoading,
    error,
    refetchBargainRequests: fetchBargainRequests,
    sendBargainRequest,
    updateBargainRequestStatus,
    getBargainStatusForProduct,
  };
};