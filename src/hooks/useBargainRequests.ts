"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_PRODUCTS_COLLECTION_ID } from '@/lib/appwrite';
import { Query, ID } from 'appwrite';
import { toast } from 'sonner';

interface BargainRequest {
  $id: string;
  productId: string;
  productTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  proposedPrice: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: string;
}

interface UseBargainRequestsState {
  buyerRequests: BargainRequest[];
  sellerRequests: BargainRequest[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  sendBargainRequest: (productId: string, proposedPrice: number) => Promise<void>;
  updateBargainStatus: (requestId: string, newStatus: 'accepted' | 'rejected' | 'cancelled') => Promise<void>;
  getBargainStatusForProduct: (productId: string) => Promise<BargainRequest | null>;
}

export const useBargainRequests = (): UseBargainRequestsState => {
  const { currentUser, userProfile, isLoading: isAuthLoading } = useAuth();
  const [buyerRequests, setBuyerRequests] = useState<BargainRequest[]>([]);
  const [sellerRequests, setSellerRequests] = useState<BargainRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const refetch = () => setRefetchTrigger(prev => prev + 1);

  useEffect(() => {
    const fetchBargainRequests = async () => {
      if (isAuthLoading || !currentUser) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        // Fetch requests where current user is the buyer
        const buyerResponse = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_TRANSACTIONS_COLLECTION_ID, // Assuming bargain requests are part of transactions or a separate collection
          [Query.equal('buyerId', currentUser.$id), Query.equal('type', 'bargain_request'), Query.orderDesc('$createdAt')]
        );
        setBuyerRequests(buyerResponse.documents as unknown as BargainRequest[]);

        // Fetch requests where current user is the seller
        const sellerResponse = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_TRANSACTIONS_COLLECTION_ID, // Assuming bargain requests are part of transactions or a separate collection
          [Query.equal('sellerId', currentUser.$id), Query.equal('type', 'bargain_request'), Query.orderDesc('$createdAt')]
        );
        setSellerRequests(sellerResponse.documents as unknown as BargainRequest[]);

      } catch (err: any) {
        console.error("Failed to fetch bargain requests:", err);
        setError(err.message || "Failed to load bargain requests.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBargainRequests();
  }, [currentUser, isAuthLoading, refetchTrigger]);

  const sendBargainRequest = async (productId: string, proposedPrice: number) => {
    if (!currentUser || !userProfile) {
      toast.error("You must be logged in to send a bargain request.");
      return;
    }
    try {
      const product = await databases.getDocument(APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID, productId);
      
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID, // Or a dedicated bargain requests collection
        ID.unique(),
        {
          productId: productId,
          productTitle: product.title,
          buyerId: currentUser.$id,
          buyerName: `${userProfile.firstName} ${userProfile.lastName}`,
          sellerId: product.sellerId,
          sellerName: product.sellerName || "Unknown Seller", // Assuming sellerName is on product or fetched
          proposedPrice: proposedPrice,
          status: 'pending',
          type: 'bargain_request',
          amount: proposedPrice, // Store proposed price as amount for consistency
        }
      );
      toast.success("Bargain request sent!");
      refetch();
    } catch (err: any) {
      console.error("Failed to send bargain request:", err);
      toast.error(err.message || "Failed to send bargain request.");
    }
  };

  const updateBargainStatus = async (requestId: string, newStatus: 'accepted' | 'rejected' | 'cancelled') => {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID, // Or dedicated bargain requests collection
        requestId,
        { status: newStatus }
      );
      toast.success(`Bargain request ${newStatus}!`);
      refetch();
    } catch (err: any) {
      console.error("Failed to update bargain status:", err);
      toast.error(err.message || "Failed to update bargain status.");
    }
  };

  const getBargainStatusForProduct = async (productId: string): Promise<BargainRequest | null> => {
    if (!currentUser) return null;
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [
          Query.equal('productId', productId),
          Query.equal('buyerId', currentUser.$id),
          Query.equal('type', 'bargain_request'),
          Query.orderDesc('$createdAt'),
          Query.limit(1)
        ]
      );
      return response.documents.length > 0 ? (response.documents[0] as unknown as BargainRequest) : null;
    } catch (err) {
      console.error("Failed to get bargain status for product:", err);
      return null;
    }
  };

  return { buyerRequests, sellerRequests, isLoading, error, refetch, sendBargainRequest, updateBargainStatus, getBargainStatusForProduct };
};