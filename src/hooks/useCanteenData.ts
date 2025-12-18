"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CANTEEN_COLLECTION_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query, ID } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export interface CanteenItem extends Models.Document {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  available: boolean;
  collegeName: string;
}

export interface CanteenOrder extends Models.Document {
  userId: string;
  userName: string;
  collegeName: string;
  items: Array<{ itemId: string; itemName: string; quantity: number; price: number }>;
  totalAmount: number;
  status: "pending" | "preparing" | "ready" | "delivered" | "cancelled";
  pickupTime?: string;
  notes?: string;
}

export const useCanteenData = () => {
  const { userProfile } = useAuth();
  const [menuItems, setMenuItems] = useState<CanteenItem[]>([]);
  const [orders, setOrders] = useState<CanteenOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCanteenData = useCallback(async () => {
    if (!userProfile?.collegeName) {
      setIsLoading(false);
      setError("User college information not available.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const itemsResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        [Query.equal('collegeName', userProfile.collegeName), Query.orderAsc('name')]
      );
      setMenuItems(itemsResponse.documents as unknown as CanteenItem[]);

      let ordersResponse;
      if (userProfile.role === 'staff' || userProfile.role === 'developer') {
        ordersResponse = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_FOOD_ORDERS_COLLECTION_ID,
          [Query.equal('collegeName', userProfile.collegeName), Query.orderDesc('$createdAt')]
        );
      } else {
        ordersResponse = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_FOOD_ORDERS_COLLECTION_ID,
          [Query.equal('buyerId', userProfile.userId), Query.orderDesc('$createdAt')]
        );
      }
      setOrders(ordersResponse.documents as unknown as CanteenOrder[]);

    } catch (err: any) {
      console.error("Error fetching canteen data:", err);
      setError(err.message || "Failed to fetch canteen data.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName, userProfile?.role, userProfile?.userId]);

  useEffect(() => {
    fetchCanteenData();

    const unsubscribeItems = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_CANTEEN_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          setMenuItems((prev) => [response.payload as unknown as CanteenItem, ...prev]);
        } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          setMenuItems((prev) =>
            prev.map((item) =>
              item.$id === (response.payload as CanteenItem).$id
                ? (response.payload as unknown as CanteenItem)
                : item
            )
          );
        } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
          setMenuItems((prev) =>
            prev.filter((item) => item.$id !== (response.payload as CanteenItem).$id)
          );
        }
      }
    );

    const unsubscribeOrders = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_FOOD_ORDERS_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          setOrders((prev) => [response.payload as unknown as CanteenOrder, ...prev]);
        } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          setOrders((prev) =>
            prev.map((order) =>
              order.$id === (response.payload as CanteenOrder).$id
                ? (response.payload as unknown as CanteenOrder)
                : order
            )
          );
        } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
          setOrders((prev) =>
            prev.filter((order) => order.$id !== (response.payload as CanteenOrder).$id)
          );
        }
      }
    );


    return () => {
      unsubscribeItems();
      unsubscribeOrders();
    };
  }, [fetchCanteenData]);

  const addMenuItem = async (itemData: Omit<CanteenItem, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId">) => {
    if (!userProfile?.collegeName) {
      toast.error("User college information not available.");
      return;
    }
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        ID.unique(),
        { ...itemData, collegeName: userProfile.collegeName }
      );
      toast.success("Menu item added successfully!");
    } catch (err: any) {
      console.error("Error adding menu item:", err);
      toast.error(err.message || "Failed to add menu item.");
    }
  };

  const updateMenuItem = async (itemId: string, itemData: Partial<CanteenItem>) => {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        itemId,
        itemData
      );
      toast.success("Menu item updated successfully!");
    } catch (err: any) {
      console.error("Error updating menu item:", err);
      toast.error(err.message || "Failed to update menu item.");
    }
  };

  const deleteMenuItem = async (itemId: string) => {
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CANTEEN_COLLECTION_ID,
        itemId
      );
      toast.success("Menu item deleted successfully!");
    } catch (err: any) {
      console.error("Error deleting menu item:", err);
      toast.error(err.message || "Failed to delete menu item.");
    }
  };

  const placeOrder = async (orderData: Omit<CanteenOrder, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "status">) => {
    if (!userProfile) {
      toast.error("User profile not available.");
      return;
    }
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        ID.unique(),
        { ...orderData, userId: userProfile.userId, userName: userProfile.name, collegeName: userProfile.collegeName, status: "pending" }
      );
      toast.success("Order placed successfully!");
    } catch (err: any) {
      console.error("Error placing order:", err);
      toast.error(err.message || "Failed to place order.");
    }
  };

  const updateOrderStatus = async (orderId: string, status: CanteenOrder["status"]) => {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        orderId,
        { status }
      );
      toast.success(`Order ${orderId} status updated to ${status}!`);
    } catch (err: any) {
      console.error("Error updating order status:", err);
      toast.error(err.message || "Failed to update order status.");
    }
  };

  return {
    menuItems,
    orders,
    isLoading,
    error,
    refetchCanteenData: fetchCanteenData,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    placeOrder,
    updateOrderStatus,
  };
};