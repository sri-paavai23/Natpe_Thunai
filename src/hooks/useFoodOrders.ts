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
}

interface FoodOrdersState {
  orders: FoodOrder[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useFoodOrders = (): FoodOrdersState => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch orders where the current user is the buyer OR the provider
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        [
            Query.or([
                Query.equal('buyerId', user.$id),
                Query.equal('providerId', user.$id)
            ]),
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
  }, [user]);

  useEffect(() => {
    fetchOrders();

    if (!user) return;

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_FOOD_ORDERS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as FoodOrder;
        
        // Only process if the current user is involved
        if (payload.buyerId !== user.$id && payload.providerId !== user.$id) {
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
  }, [fetchOrders, user]);

  return { orders, isLoading, error, refetch: fetchOrders };
};