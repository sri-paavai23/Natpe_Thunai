import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query, Models, ID } from 'appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Product } from './useMarketListings';

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

// Collection IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const BARGAIN_REQUESTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID;

export type BargainStatus = "initiated" | "accepted" | "rejected" | "cancelled" | "completed" | "none";

export interface BargainRequest extends Models.Document { // Extend Models.Document
  productId: string;
  productTitle: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  requestedPrice: number;
  status: BargainStatus;
  message?: string;
  collegeName: string;
}

interface BargainRequestsState {
  buyerRequests: BargainRequest[];
  sellerRequests: BargainRequest[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  sendBargainRequest: (product: Product, requestedPrice: number, message?: string) => Promise<void>;
  updateBargainStatus: (requestId: string, newStatus: BargainStatus) => Promise<void>;
  getBargainStatusForProduct: (productId: string) => Promise<{ status: BargainStatus; requestId?: string }>;
}

export const useBargainRequests = (): BargainRequestsState => {
  const { user, userProfile } = useAuth();
  const [buyerRequests, setBuyerRequests] = useState<BargainRequest[]>([]);
  const [sellerRequests, setSellerRequests] = useState<BargainRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBargainRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!user || !userProfile?.collegeName) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch requests where current user is the buyer
      const buyerResponse = await databases.listDocuments(
        DATABASE_ID,
        BARGAIN_REQUESTS_COLLECTION_ID,
        [
          Query.equal('buyerId', user.$id),
          Query.equal('collegeName', userProfile.collegeName),
          Query.orderDesc('$createdAt')
        ]
      );
      setBuyerRequests(buyerResponse.documents as BargainRequest[]); // Type assertion is now safer

      // Fetch requests where current user is the seller
      const sellerResponse = await databases.listDocuments(
        DATABASE_ID,
        BARGAIN_REQUESTS_COLLECTION_ID,
        [
          Query.equal('sellerId', user.$id),
          Query.equal('collegeName', userProfile.collegeName),
          Query.orderDesc('$createdAt')
        ]
      );
      setSellerRequests(sellerResponse.documents as BargainRequest[]); // Type assertion is now safer

    } catch (err: any) {
      console.error("Error fetching bargain requests:", err);
      setError("Failed to fetch bargain requests.");
      toast.error("Failed to load bargain requests.");
    } finally {
      setIsLoading(false);
    }
  }, [user, userProfile?.collegeName]);

  useEffect(() => {
    fetchBargainRequests();
  }, [fetchBargainRequests]);

  const sendBargainRequest = async (product: Product, requestedPrice: number, message?: string) => {
    if (!user || !userProfile?.collegeName) {
      toast.error("You must be logged in to send a bargain request.");
      return;
    }
    if (user.$id === product.sellerId) {
      toast.error("You cannot send a bargain request for your own product.");
      return;
    }

    try {
      const newRequest = await databases.createDocument(
        DATABASE_ID,
        BARGAIN_REQUESTS_COLLECTION_ID,
        ID.unique(),
        {
          productId: product.$id,
          productTitle: product.title,
          sellerId: product.sellerId,
          sellerName: product.sellerName,
          buyerId: user.$id,
          buyerName: user.name,
          requestedPrice,
          status: "initiated",
          message: message || undefined,
          collegeName: userProfile.collegeName,
        }
      );
      setBuyerRequests(prev => [newRequest as BargainRequest, ...prev]); // Type assertion is now safer
      toast.success("Bargain request sent!");
    } catch (err: any) {
      console.error("Error sending bargain request:", err);
      toast.error(err.message || "Failed to send bargain request.");
      throw err;
    }
  };

  const updateBargainStatus = async (requestId: string, newStatus: BargainStatus) => {
    if (!user) {
      toast.error("You must be logged in to update a bargain request.");
      return;
    }

    try {
      const updatedRequest = await databases.updateDocument(
        DATABASE_ID,
        BARGAIN_REQUESTS_COLLECTION_ID,
        requestId,
        { status: newStatus }
      );
      setBuyerRequests(prev => prev.map(req => req.$id === requestId ? { ...req, status: newStatus } : req));
      setSellerRequests(prev => prev.map(req => req.$id === requestId ? { ...req, status: newStatus } : req));
      toast.success(`Bargain request status updated to ${newStatus}!`);
    } catch (err: any) {
      console.error("Error updating bargain status:", err);
      toast.error(err.message || "Failed to update bargain status.");
      throw err;
    }
  };

  const getBargainStatusForProduct = useCallback(async (productId: string): Promise<{ status: BargainStatus; requestId?: string }> => {
    if (!user) {
      return { status: "none" };
    }
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        BARGAIN_REQUESTS_COLLECTION_ID,
        [
          Query.equal('productId', productId),
          Query.equal('buyerId', user.$id),
          Query.or([
            Query.equal('status', 'initiated'),
            Query.equal('status', 'accepted'),
          ]),
          Query.limit(1)
        ]
      );
      if (response.documents.length > 0) {
        const request = response.documents[0] as BargainRequest; // Type assertion is now safer
        return { status: request.status, requestId: request.$id };
      }
      return { status: "none" };
    } catch (err) {
      console.error("Error fetching bargain status for product:", err);
      return { status: "none" };
    }
  }, [user]);

  return {
    buyerRequests,
    sellerRequests,
    isLoading,
    error,
    refetch: fetchBargainRequests,
    sendBargainRequest,
    updateBargainStatus,
    getBargainStatusForProduct,
  };
};