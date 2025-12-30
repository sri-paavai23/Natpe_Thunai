import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_PRODUCTS_COLLECTION_ID, APPWRITE_USER_PROFILES_COLLECTION_ID, client } from '@/lib/appwrite'; // Added client for subscribe
import { Query, ID } from 'appwrite';
import { toast } from 'sonner';
import { Product } from '@/lib/utils'; // Assuming Product interface is defined in utils
import { Models } from 'appwrite';

export interface BargainRequest extends Models.Document {
  productId: string;
  productTitle: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  requestedAmount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'; // Changed 'denied' to 'rejected'
  $createdAt: string;
  collegeName: string;
  isBargain: boolean; // Added isBargain
  type: 'sell' | 'rent'; // Added type
}

interface UseBargainRequestsState {
  sellerRequests: BargainRequest[];
  buyerRequests: BargainRequest[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  sendBargainRequest: (product: Product, requestedAmount: number) => Promise<BargainRequest | undefined>;
  updateBargainStatus: (requestId: string, status: 'accepted' | 'rejected' | 'cancelled') => Promise<void>;
  getBargainStatusForProduct: (productId: string) => { status: BargainRequest['status'] | null, requestId: string | null };
}

export const useBargainRequests = (): UseBargainRequestsState => {
  const { user, userProfile, loading: isAuthLoading } = useAuth(); // Corrected 'currentUser' to 'user', 'isLoading' to 'loading'
  const [sellerRequests, setSellerRequests] = useState<BargainRequest[]>([]);
  const [buyerRequests, setBuyerRequests] = useState<BargainRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBargainRequests = useCallback(async () => {
    if (isAuthLoading || !user?.$id || !userProfile?.collegeName) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Fetch requests where current user is the seller
      const sellerResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [
          Query.equal('sellerId', user.$id),
          Query.equal('isBargain', true),
          Query.equal('collegeName', userProfile.collegeName), // Filter by college
          Query.orderDesc('$createdAt')
        ]
      );
      setSellerRequests(sellerResponse.documents as unknown as BargainRequest[]); // Cast to unknown first

      // Fetch requests where current user is the buyer
      const buyerResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [
          Query.equal('buyerId', user.$id),
          Query.equal('isBargain', true),
          Query.equal('collegeName', userProfile.collegeName), // Filter by college
          Query.orderDesc('$createdAt')
        ]
      );
      setBuyerRequests(buyerResponse.documents as unknown as BargainRequest[]); // Cast to unknown first

    } catch (err: any) {
      console.error("Error fetching bargain requests:", err);
      setError(err.message || "Failed to fetch bargain requests.");
      setSellerRequests([]);
      setBuyerRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.$id, userProfile?.collegeName, isAuthLoading]);

  useEffect(() => {
    fetchBargainRequests();
  }, [fetchBargainRequests]);

  const sendBargainRequest = useCallback(async (product: Product, requestedAmount: number): Promise<BargainRequest | undefined> => {
    if (!user?.$id || !userProfile?.collegeName) {
      toast.error("You must be logged in and have college information to send a bargain request.");
      return;
    }
    if (user.$id === product.sellerId) {
      toast.error("You cannot send a bargain request for your own product.");
      return;
    }
    if (requestedAmount <= 0 || requestedAmount >= product.price) {
      toast.error("Bargain amount must be greater than 0 and less than the original price.");
      return;
    }

    try {
      const existingRequest = buyerRequests.find(req => req.productId === product.$id && req.status === 'pending');
      if (existingRequest) {
        toast.info("You already have a pending bargain request for this product.");
        return existingRequest;
      }

      const newRequest = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          productId: product.$id,
          productTitle: product.title,
          sellerId: product.sellerId,
          sellerName: product.sellerName,
          buyerId: user.$id,
          buyerName: user.name,
          requestedAmount: requestedAmount,
          status: 'pending',
          isBargain: true,
          type: product.type, // 'sell' or 'rent'
          collegeName: userProfile.collegeName,
        }
      );
      toast.success("Bargain request sent successfully!");
      fetchBargainRequests(); // Refetch to update lists
      return newRequest as unknown as BargainRequest; // Cast to unknown first
    } catch (err: any) {
      console.error("Error sending bargain request:", err);
      toast.error(err.message || "Failed to send bargain request.");
    }
  }, [user?.$id, user?.name, userProfile?.collegeName, buyerRequests, fetchBargainRequests]);

  const updateBargainStatus = useCallback(async (requestId: string, status: 'accepted' | 'rejected' | 'cancelled') => {
    if (!user?.$id || !userProfile?.collegeName) {
      toast.error("You must be logged in to update bargain status.");
      return;
    }

    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        requestId,
        { status }
      );
      toast.success(`Bargain request ${status}!`);
      fetchBargainRequests(); // Refetch to update lists
    } catch (err: any) {
      console.error("Error updating bargain status:", err);
      toast.error(err.message || "Failed to update bargain status.");
    }
  }, [user?.$id, userProfile?.collegeName, fetchBargainRequests]);

  const getBargainStatusForProduct = useCallback((productId: string) => {
    const request = buyerRequests.find(req => req.productId === productId);
    return { status: request?.status || null, requestId: request?.$id || null };
  }, [buyerRequests]);

  // Real-time subscriptions
  useEffect(() => {
    if (!userProfile?.collegeName) return;

    const unsubscribeSeller = client.subscribe( // Corrected to client.subscribe
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TRANSACTIONS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as BargainRequest; // Cast to unknown first
        if (payload.isBargain && payload.collegeName === userProfile.collegeName) {
          if (payload.sellerId === user?.$id) {
            // Update seller requests
            setSellerRequests(prev => {
              const existingIndex = prev.findIndex(req => req.$id === payload.$id);
              if (existingIndex > -1) {
                const newArr = [...prev];
                newArr[existingIndex] = payload;
                return newArr;
              }
              return [payload, ...prev];
            });
          } else if (payload.buyerId === user?.$id) {
            // Update buyer requests
            setBuyerRequests(prev => {
              const existingIndex = prev.findIndex(req => req.$id === payload.$id);
              if (existingIndex > -1) {
                const newArr = [...prev];
                newArr[existingIndex] = payload;
                return newArr;
              }
              return [payload, ...prev];
            });
          }
        }
      }
    );

    return () => {
      unsubscribeSeller();
    };
  }, [user?.$id, userProfile?.collegeName]);

  return {
    sellerRequests,
    buyerRequests,
    isLoading,
    error,
    refetch: fetchBargainRequests,
    sendBargainRequest,
    updateBargainStatus,
    getBargainStatusForProduct,
  };
};