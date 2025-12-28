import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query, Models, ID } from 'appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

// Collection IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const FOOD_ORDERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_FOOD_ORDERS_COLLECTION_ID;

export type OrderStatus = "Pending" | "Preparing" | "Ready for Pickup" | "Delivered" | "Cancelled";

export interface FoodOrder extends Models.Document { // Extend Models.Document
  offeringId: string;
  offeringName: string;
  canteenName: string;
  collegeName: string;
  buyerId: string;
  buyerName: string;
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  deliveryLocation: string;
  contactNumber: string;
  notes?: string;
  ambassadorId?: string; // ID of the ambassador delivering
  ambassadorName?: string; // Name of the ambassador
  $sequence: number; // Made $sequence required
}

interface FoodOrdersState {
  orders: FoodOrder[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  placeOrder: (orderData: Omit<FoodOrder, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "buyerId" | "buyerName" | "collegeName" | "status" | "ambassadorId" | "ambassadorName" | "$sequence">) => Promise<void>; // Omit $sequence
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, ambassadorId?: string, ambassadorName?: string) => Promise<void>;
}

export const useFoodOrders = (): FoodOrdersState => {
  const { user, userProfile } = useAuth();
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        FOOD_ORDERS_COLLECTION_ID,
        [
          Query.or([
            Query.equal('buyerId', user.$id),
            Query.equal('ambassadorId', user.$id),
            userProfile?.collegeName ? Query.equal('collegeName', userProfile.collegeName) : Query.limit(100) // For canteen owners/ambassadors to see all orders in their college
          ]),
          Query.orderDesc('$createdAt')
        ]
      );
      setOrders(response.documents as FoodOrder[]); // Type assertion is now safer
    } catch (err: any) {
      console.error("Error fetching food orders:", err);
      setError("Failed to fetch food orders.");
      toast.error("Failed to load food orders.");
    } finally {
      setIsLoading(false);
    }
  }, [user, userProfile?.collegeName]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const placeOrder = async (orderData: Omit<FoodOrder, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "buyerId" | "buyerName" | "collegeName" | "status" | "ambassadorId" | "ambassadorName" | "$sequence">) => {
    if (!user || !userProfile?.collegeName) {
      toast.error("You must be logged in and have a college name set to place an order.");
      return;
    }

    try {
      const newOrder = await databases.createDocument(
        DATABASE_ID,
        FOOD_ORDERS_COLLECTION_ID,
        ID.unique(),
        {
          ...orderData,
          buyerId: user.$id,
          buyerName: user.name,
          collegeName: userProfile.collegeName,
          status: "Pending",
          $sequence: 0, // Provide a default for $sequence
        }
      );
      setOrders(prev => [newOrder as FoodOrder, ...prev]); // Type assertion is now safer
      toast.success("Order placed successfully!");
    } catch (err: any) {
      console.error("Error placing order:", err);
      toast.error(err.message || "Failed to place order.");
      throw err;
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, ambassadorId?: string, ambassadorName?: string) => {
    if (!user) {
      toast.error("You must be logged in to update an order.");
      return;
    }

    try {
      const dataToUpdate: Partial<FoodOrder> = { status: newStatus };
      if (ambassadorId && ambassadorName) {
        dataToUpdate.ambassadorId = ambassadorId;
        dataToUpdate.ambassadorName = ambassadorName;
      }

      const updatedOrder = await databases.updateDocument(
        DATABASE_ID,
        FOOD_ORDERS_COLLECTION_ID,
        orderId,
        dataToUpdate
      );
      setOrders(prev => prev.map(order => order.$id === orderId ? { ...order, ...dataToUpdate } : order));
      toast.success(`Order ${orderId} status updated to ${newStatus}!`);
    } catch (err: any) {
      console.error("Error updating order status:", err);
      toast.error(err.message || "Failed to update order status.");
      throw err;
    }
  };

  return {
    orders,
    isLoading,
    error,
    refetch: fetchOrders,
    placeOrder,
    updateOrderStatus,
  };
};