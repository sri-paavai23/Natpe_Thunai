"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";
import {
  databases,
  APPWRITE_DATABASE_ID,
  APPWRITE_TRANSACTIONS_COLLECTION_ID,
  APPWRITE_CHAT_ROOMS_COLLECTION_ID,
  APPWRITE_USER_PROFILES_COLLECTION_ID,
  APPWRITE_FOOD_ORDERS_COLLECTION_ID,
} from "@/lib/appwrite";
import { Query, ID } from "appwrite";
import { useAuth } from "@/context/AuthContext";
import { useFoodOrders, FoodOrder } from "@/hooks/useFoodOrders";
import { toast } from "sonner";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Button
} from "@/components/ui/button";
import {
  Badge
} from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Input
} from "@/components/ui/input";
import {
  Label
} from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Activity,
  PackageCheck,
  MessageCircle,
  IndianRupee,
  Save,
  Users,
  UserCircle,
  Target,
  CheckCircle,
  CheckCircle2,
  Wallet,
  Hourglass,
  Handshake,
  Utensils,
  Briefcase,
  ShoppingBag,
  Clock,
} from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";

/* ---------------- STATUS CONSTANTS ---------------- */

const STATUS = {
  INITIATED: "initiated",
  NEGOTIATING: "negotiating",
  PAYMENT_CONFIRMED: "payment_confirmed_to_developer",
  COMMISSION_DEDUCTED: "commission_deducted",
  ACTIVE: "active",
  DELIVERED: "seller_confirmed_delivery",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  FAILED: "failed",
  DISPUTED: "disputed",
} as const;

/* ---------------- NOTIFICATION (SECURE) ---------------- */

const sendTransactionNotification = async (
  targetUserId: string,
  title: string,
  message: string,
  data: any = {}
) => {
  try {
    await fetch("/functions/sendNotification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetUserId,
        title,
        message,
        data,
      }),
    });
  } catch (e) {
    console.error("Notification error", e);
  }
};

/* ---------------- TYPES ---------------- */

interface BaseTrackingItem {
  id: string;
  description: string;
  date: string;
  status: string;
  timestamp: number;
  lastUpdated: number;
  isUserProvider: boolean;
}

interface MarketTransactionItem extends BaseTrackingItem {
  type: "Transaction" | "Service" | "Rental" | "Errand";
  productTitle: string;
  amount: number;
  sellerName: string;
  buyerName: string;
  sellerId: string;
  buyerId: string;
}

interface FoodOrderItem extends BaseTrackingItem {
  type: "Food Order";
  offeringTitle: string;
  totalAmount: number;
  providerName: string;
  buyerName: string;
  providerId: string;
  buyerId: string;
}

type TrackingItem = MarketTransactionItem | FoodOrderItem;

/* ---------------- MAIN PAGE ---------------- */

const TrackingPage = () => {
  const { user, userProfile } = useAuth();
  const { orders: initialFoodOrders } = useFoodOrders();
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  /* ---------------- DATA REFRESH ---------------- */

  const refreshData = useCallback(
    debounce(async () => {
      if (!user?.$id) return;
      setIsLoading(true);

      try {
        const txns = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_TRANSACTIONS_COLLECTION_ID,
          [
            Query.or([
              Query.equal("buyerId", user.$id),
              Query.equal("sellerId", user.$id),
            ]),
            Query.orderDesc("$createdAt"),
            Query.limit(100),
          ]
        );

        const map = new Map<string, TrackingItem>();

        txns.documents.forEach((doc: any) => {
          map.set(doc.$id, processTransactionDoc(doc, user.$id));
        });

        initialFoodOrders.forEach((doc: any) => {
          map.set(doc.$id, processFoodDoc(doc, user.$id));
        });

        setItems(
          Array.from(map.values()).sort(
            (a, b) => b.timestamp - a.timestamp
          )
        );
      } catch {
        toast.error("Failed to sync activity");
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [user, initialFoodOrders]
  );

  useEffect(() => {
    refreshData();
    const unsub = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TRANSACTIONS_COLLECTION_ID}.documents`,
      refreshData
    );
    return () => unsub();
  }, [refreshData]);

  /* ---------------- ACTION HANDLER ---------------- */

  const handleAction = async (action: string, id: string, payload?: any) => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    const isFood = item.type === "Food Order";
    const collectionId = isFood
      ? APPWRITE_FOOD_ORDERS_COLLECTION_ID
      : APPWRITE_TRANSACTIONS_COLLECTION_ID;

    const status = item.status.toLowerCase();

    try {
      if (action === "update_errand_price") {
        if (!payload?.amount || payload.amount <= 0) {
          toast.warning("Invalid bounty amount");
          return;
        }
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          collectionId,
          id,
          { amount: payload.amount }
        );
      }

      if (action === "start_work" && status === STATUS.PAYMENT_CONFIRMED) {
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          collectionId,
          id,
          { status: STATUS.ACTIVE }
        );
      }

      if (action === "mark_delivered" && status === STATUS.ACTIVE) {
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          collectionId,
          id,
          { status: STATUS.DELIVERED }
        );
      }

      if (action === "confirm_receipt" && status === STATUS.DELIVERED) {
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          collectionId,
          id,
          { status: STATUS.COMPLETED }
        );

        const roomId = `room_${id}`;
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_CHAT_ROOMS_COLLECTION_ID,
          roomId,
          { status: "closed" }
        );
      }

      const counterpartyId = item.isUserProvider
        ? (item as any).buyerId
        : (item as any).sellerId || (item as any).providerId;

      sendTransactionNotification(
        counterpartyId,
        "Activity Update",
        "Your transaction status has changed",
        { transactionId: id }
      );

      refreshData();
    } catch {
      toast.error("Action failed");
    }
  };

  /* ---------------- CHAT ---------------- */

  const handleChatNavigation = async (item: TrackingItem) => {
    const roomId = `room_${item.id}`;

    try {
      await databases.getDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CHAT_ROOMS_COLLECTION_ID,
        roomId
      );
      navigate(`/chat/${roomId}`);
    } catch {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CHAT_ROOMS_COLLECTION_ID,
        roomId,
        {
          transactionId: item.id,
          buyerId: (item as any).buyerId,
          providerId: (item as any).sellerId || (item as any).providerId,
          collegeName: userProfile?.collegeName || "Campus",
          status: "active",
        }
      );
      navigate(`/chat/${roomId}`);
    }
  };

  /* ---------------- FILTERS ---------------- */

  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  const activeTasks = items.filter(i => {
    const s = i.status.toLowerCase();
    return ![
      STATUS.COMPLETED,
      STATUS.CANCELLED,
      STATUS.FAILED,
      STATUS.DISPUTED,
    ].includes(s as any);
  });

  const historyTasks = items.filter(i => {
    const s = i.status.toLowerCase();
    return [
      STATUS.COMPLETED,
      STATUS.CANCELLED,
      STATUS.FAILED,
      STATUS.DISPUTED,
    ].includes(s as any) && now - i.lastUpdated < SEVEN_DAYS;
  });

  /* ---------------- UI ---------------- */

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-md mx-auto mb-6 flex justify-between">
        <h1 className="text-3xl font-black uppercase">
          Activity<span className="text-secondary-neon">Log</span>
        </h1>
        {isLoading && <Loader2 className="animate-spin" />}
      </div>

      <Tabs defaultValue="all">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="all">Active</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {activeTasks.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              <Activity className="mx-auto mb-2" />
              No Active Tasks
            </div>
          ) : (
            activeTasks.map(item => (
              <Card key={item.id} className="mb-4">
                <CardContent className="p-4">
                  <h4 className="font-bold">
                    {"offeringTitle" in item
                      ? item.offeringTitle
                      : item.productTitle}
                  </h4>
                  <Button
                    className="mt-3 w-full"
                    onClick={() => handleChatNavigation(item)}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Open Chat
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history">
          {historyTasks.length === 0 ? (
            <div className="text-center py-20 opacity-40">
              <PackageCheck className="mx-auto mb-2" />
              No History
            </div>
          ) : (
            historyTasks.map(item => (
              <Card key={item.id} className="mb-4 opacity-70">
                <CardContent className="p-4">
                  <h4 className="font-bold">
                    {"offeringTitle" in item
                      ? item.offeringTitle
                      : item.productTitle}
                  </h4>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <MadeWithDyad />
    </div>
  );
};

/* ---------------- HELPERS ---------------- */

const processTransactionDoc = (doc: any, uid: string): MarketTransactionItem => ({
  id: doc.$id,
  type:
    doc.type === "errand"
      ? "Errand"
      : doc.type === "service"
      ? "Service"
      : doc.type === "rent"
      ? "Rental"
      : "Transaction",
  productTitle: doc.productTitle || "Untitled",
  description: doc.productTitle,
  status: doc.status,
  timestamp: new Date(doc.$createdAt).getTime(),
  lastUpdated: new Date(doc.$updatedAt).getTime(),
  date: new Date(doc.$createdAt).toLocaleDateString("en-IN"),
  amount: doc.amount || 0,
  sellerName: doc.sellerName,
  buyerName: doc.buyerName,
  sellerId: doc.sellerId,
  buyerId: doc.buyerId,
  isUserProvider: doc.sellerId === uid,
});

const processFoodDoc = (doc: any, uid: string): FoodOrderItem => ({
  id: doc.$id,
  type: "Food Order",
  offeringTitle: doc.offeringTitle,
  description: doc.offeringTitle,
  status: doc.status,
  timestamp: new Date(doc.$createdAt).getTime(),
  lastUpdated: new Date(doc.$updatedAt).getTime(),
  date: new Date(doc.$createdAt).toLocaleDateString("en-IN"),
  totalAmount: doc.totalAmount,
  providerName: doc.providerName,
  buyerName: doc.buyerName,
  providerId: doc.providerId,
  buyerId: doc.buyerId,
  isUserProvider: doc.providerId === uid,
});

export default TrackingPage;
