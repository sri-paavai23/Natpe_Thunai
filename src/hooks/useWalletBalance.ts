"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from '@/lib/appwrite';
import { Query, Models } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

// Define local interfaces for raw Appwrite documents to ensure type safety
// matching the database schema rather than the UI tracking item.
interface TransactionDoc extends Models.Document {
  buyerId: string;
  sellerId: string;
  amount: number;
  netSellerAmount?: number;
  status: string; // raw appwrite status (e.g., 'paid_to_seller')
}

interface FoodOrderDoc extends Models.Document {
  buyerId: string;
  providerId: string;
  totalAmount: number;
  status: string; // raw appwrite status (e.g., 'Delivered')
}

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
      // 1. Fetch Market Transactions
      const marketTransactionsResponse = await databases.listDocuments<TransactionDoc>(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [
          Query.or([
            Query.equal('buyerId', user.$id),
            Query.equal('sellerId', user.$id)
          ]),
          Query.limit(100)
        ]
      );

      marketTransactionsResponse.documents.forEach((tx) => {
        // Earnings: Only count if you are the seller AND status confirms payout
        // Note: 'paid_to_seller' or 'completed' usually implies money moved.
        if (tx.sellerId === user.$id && (tx.status === 'paid_to_seller' || tx.status === 'completed') && tx.netSellerAmount !== undefined) {
          totalEarned += tx.netSellerAmount;
        }
        
        // Spending: Count if you are buyer and transaction wasn't failed/cancelled
        if (tx.buyerId === user.$id && tx.status !== 'failed') {
          totalSpent += tx.amount;
        }
      });

      // 2. Fetch Food Orders
      const foodOrdersResponse = await databases.listDocuments<FoodOrderDoc>(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        [
          Query.or([
            Query.equal('buyerId', user.$id),
            Query.equal('providerId', user.$id)
          ]),
          Query.limit(100)
        ]
      );

      foodOrdersResponse.documents.forEach((order) => {
        // Earnings: Provider gets paid on Delivery
        if (order.providerId === user.$id && order.status === 'Delivered') {
          totalEarned += order.totalAmount;
        }
        // Spending: Buyer spends on Delivery
        if (order.buyerId === user.$id && order.status === 'Delivered') {
          totalSpent += order.totalAmount;
        }
      });

      setEarnedBalance(totalEarned);
      setSpentBalance(totalSpent);

    } catch (err: any) {
      console.error("Error fetching wallet balances:", err);
      setError(err.message || "Failed to load wallet balances.");
      // Silent error or toast depending on UX preference
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBalances();

    const unsubscribeTransactions = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TRANSACTIONS_COLLECTION_ID}.documents`,
      () => fetchBalances()
    );

    const unsubscribeFoodOrders = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_FOOD_ORDERS_COLLECTION_ID}.documents`,
      () => fetchBalances()
    );

    return () => {
      unsubscribeTransactions();
      unsubscribeFoodOrders();
    };
  }, [fetchBalances]);

  return { earnedBalance, spentBalance, isLoading, error, refetch: fetchBalances };
};