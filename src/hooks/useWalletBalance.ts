"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from '@/lib/appwrite';
import { Query, Models } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { MarketTransactionItem, FoodOrderItem } from '@/pages/TrackingPage'; // Re-using interfaces from TrackingPage

interface WalletBalanceState {
  earnedBalance: number;
  spentBalance: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useWalletBalance = (): WalletBalanceState => {
  const { user } = useAuth();
  const [earnedBalance, setEarnedBalance] = useState(0);
  const [spentBalance, setSpentBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    if (!user?.$id) {
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
      // Fetch Market Transactions (Buy/Sell)
      const marketTransactionsResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [
          Query.or([
            Query.equal('buyerId', user.$id),
            Query.equal('userId', user.$id)
          ]),
          Query.limit(100) // Fetch a reasonable number of transactions
        ]
      );

      marketTransactionsResponse.documents.forEach((doc: Models.Document) => {
        const tx = doc as unknown as MarketTransactionItem;
        if (tx.userId === user.$id && tx.status === 'paid_to_seller' && tx.netSellerAmount !== undefined) {
          totalEarned += tx.netSellerAmount;
        }
        if (tx.buyerId === user.$id && tx.status !== 'failed') { // Count all non-failed purchases as spent
          totalSpent += tx.amount;
        }
      });

      // Fetch Food Orders
      const foodOrdersResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        [
          Query.or([
            Query.equal('buyerId', user.$id),
            Query.equal('providerId', user.$id)
          ]),
          Query.limit(100) // Fetch a reasonable number of orders
        ]
      );

      foodOrdersResponse.documents.forEach((doc: Models.Document) => {
        const order = doc as unknown as FoodOrderItem;
        if (order.providerId === user.$id && order.status === 'Delivered') {
          totalEarned += order.totalAmount;
        }
        if (order.buyerId === user.$id && order.status === 'Delivered') { // Count delivered orders as spent
          totalSpent += order.totalAmount;
        }
      });

      setEarnedBalance(totalEarned);
      setSpentBalance(totalSpent);

    } catch (err: any) {
      console.error("Error fetching wallet balances:", err);
      setError(err.message || "Failed to load wallet balances.");
      toast.error("Failed to load wallet balances.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBalances();

    // Setup real-time subscriptions for transactions and food orders
    const unsubscribeTransactions = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TRANSACTIONS_COLLECTION_ID}.documents`,
      () => {
        fetchBalances(); // Refetch balances on any transaction change
      }
    );

    const unsubscribeFoodOrders = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_FOOD_ORDERS_COLLECTION_ID}.documents`,
      () => {
        fetchBalances(); // Refetch balances on any food order change
      }
    );

    return () => {
      unsubscribeTransactions();
      unsubscribeFoodOrders();
    };
  }, [fetchBalances]);

  return { earnedBalance, spentBalance, isLoading, error, refetch: fetchBalances };
};