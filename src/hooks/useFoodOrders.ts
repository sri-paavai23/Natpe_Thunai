"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export interface FoodOrder extends Models.Document {
  offeringId: string;
  offeringTitle: string;
  providerId: string;
  providerName: string;
  buyerId: string;
  buyerName: string;
  quantity: number;
  totalAmount: number;
  deliveryLocation: string; // Added missing property
  notes: string; // Added missing property
  status: "Pending Confirmation" | "Confirmed" | "Preparing" | "Out for Delivery" | "Delivered" | "Cancelled";
  collegeName: string; // NEW: Add collegeName
}

interface FoodOrdersState {
  orders: FoodOrder[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useFoodOrders = (): FoodOrdersState => {
  const { user, userProfile } = useAuth(); // NEW: Get userProfile to access collegeName
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user?.$id || !userProfile?.collegeName) { // NEW: Only fetch if user and collegeName are available
        setIsLoading(false);
        setOrders([]); // Clear orders if no user or college is set
        return;
    }
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch orders where the current user is the buyer OR the provider AND from their college
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        [
            Query.or([
                Query.equal('buyerId', user.$id),
                Query.equal('providerId', user.$id)
            ]),
            Query.equal('collegeName', userProfile.collegeName), // NEW: Filter by collegeName
            Query.orderDesc('$createdAt')
        ]
      );
      setOrders(response.documents as unknown as FoodOrder[]);
    } catch (err: any) {
      console.error("Error fetching food orders:", err);
      setError(err.message || "Failed to load food orders.");
      toast.error("Failed to load food orders.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.$id, userProfile?.collegeName]); // NEW: Depend on userProfile.collegeName

  useEffect(() => {
    fetchOrders();

    if (!user?.$id || !userProfile?.collegeName) return; // NEW: Only subscribe if user and collegeName are available

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_FOOD_ORDERS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as FoodOrder;
        
        // Only process if the current user is involved AND from their college
        if ((payload.buyerId !== user.$id && payload.providerId !== user.$id) || payload.collegeName !== userProfile.collegeName) { // NEW: Check collegeName
            return;
        }

        setOrders(prev => {
          const existingIndex = prev.findIndex(o => o.$id === payload.$id);

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1) {
              toast.info(`New food order: ${payload.offeringTitle}`);
              return [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              toast.info(`Order status updated: ${payload.offeringTitle} is now ${payload.status}`);
              return prev.map(o => o.$id === payload.$id ? payload : o);
            }
          }
          return prev;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchOrders, user?.$id, userProfile?.collegeName]); // NEW: Depend on userProfile.collegeName

  return { orders, isLoading, error, refetch: fetchOrders };
};