"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from '@/lib/appwrite';
import { Query, Models } from 'appwrite';
import { toast } from 'sonner';

// Define interfaces directly in this file as they are not exported from TrackingPage
interface Transaction extends Models.Document {
  productId: string;
  productTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  status: string;
  type: "buy" | "rent" | "service";
  isBargain: boolean;
}

interface FoodOrder extends Models.Document {
  offeringId: string;
  offeringTitle: string;
  providerId: string;
  providerName: string;
  buyerId: string;
  buyerName: string;
  quantity: number;
  totalAmount: number;
  deliveryLocation: string;
  notes: string;
  status: string;
}

export const useWalletBalance = () => {
  const { user } = useAuth();
  const [earnedBalance, setEarnedBalance] = useState(0);
  const [spentBalance, setSpentBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!user) {
      setEarnedBalance(0);
      setSpentBalance(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    let totalEarned = 0;
    let totalSpent = 0;

    try {
      // Fetch transactions where user is the seller (earned)
      const salesResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [
          Query.equal('sellerId', user.$id),
          Query.equal('status', 'Completed'), // Only count completed transactions
          Query.select(['amount']) // Only fetch amount to optimize
        ]
      );
      salesResponse.documents.forEach(doc => {
        totalEarned += (doc as unknown as Transaction).amount;
      });

      // Fetch transactions where user is the buyer (spent)
      const purchasesResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [
          Query.equal('buyerId', user.$id),
          Query.equal('status', 'Completed'), // Only count completed transactions
          Query.select(['amount'])
        ]
      );
      purchasesResponse.documents.forEach(doc => {
        totalSpent += (doc as unknown as Transaction).amount;
      });

      // Fetch food orders where user is the buyer (spent)
      const foodOrdersResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        [
          Query.equal('buyerId', user.$id),
          Query.equal('status', 'Delivered'), // Only count delivered food orders
          Query.select(['totalAmount'])
        ]
      );
      foodOrdersResponse.documents.forEach(doc => {
        totalSpent += (doc as unknown as FoodOrder).totalAmount;
      });

      setEarnedBalance(totalEarned);
      setSpentBalance(totalSpent);

    } catch (err: any) {
      console.error("Error fetching wallet balances:", err);
      setError(err.message || "Failed to fetch wallet balances.");
      toast.error(err.message || "Failed to fetch wallet balances.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBalances();

    // Setup real-time listeners for relevant collections
    const unsubscribeTransactions = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TRANSACTIONS_COLLECTION_ID}.documents`,
      (response) => {
        // Re-fetch balances on any transaction change
        fetchBalances();
      }
    );

    const unsubscribeFoodOrders = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_FOOD_ORDERS_COLLECTION_ID}.documents`,
      (response) => {
        // Re-fetch balances on any food order change
        fetchBalances();
      }
    );

    return () => {
      unsubscribeTransactions();
      unsubscribeFoodOrders();
    };
  }, [fetchBalances]);

  return { earnedBalance, spentBalance, isLoading, error, refreshBalances: fetchBalances };
};