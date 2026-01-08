"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, DollarSign, Loader2, Utensils, CheckCircle, ArrowRight, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Models, Query } from "appwrite";
import { calculateCommissionRate } from "@/utils/commission";
import { useFoodOrders, FoodOrder } from "@/hooks/useFoodOrders";
import { Button } from "@/components/ui/button";

// --- Tracking Item Interfaces ---

interface BaseTrackingItem {
  id: string;
  description: string;
  date: string;
  status: string;
  isUserProvider: boolean;
}

export interface MarketTransactionItem extends BaseTrackingItem {
  type: "Transaction" | "Cash Exchange";
  productTitle: string;
  amount: number;
  sellerName: string;
  buyerName: string;
  buyerId: string;
  sellerId: string;
  commissionAmount?: number;
  netSellerAmount?: number;
  collegeName: string;
  ambassadorDelivery?: boolean;
  ambassadorMessage?: string;
  appwriteStatus: string; // Keep raw status for logic
}

export interface FoodOrderItem extends BaseTrackingItem {
  type: "Food Order";
  offeringTitle: string;
  totalAmount: number;
  providerName: string;
  buyerName: string;
  buyerId: string;
  providerId: string;
  orderStatus: FoodOrder["status"];
  quantity: number;
  deliveryLocation: string;
  notes: string;
  collegeName: string;
  ambassadorDelivery?: boolean;
  ambassadorMessage?: string;
}

type TrackingItem = MarketTransactionItem | FoodOrderItem;

// --- Conversion Functions ---

const mapAppwriteStatusToTrackingStatus = (appwriteStatus: string): string => {
  switch (appwriteStatus) {
    case "initiated":
      return "Initiated (Awaiting Payment)";
    case "payment_confirmed_to_developer":
      return "Payment Confirmed (Processing)";
    case "commission_deducted":
      return "Commission Deducted (Awaiting Seller Pay)";
    case "seller_confirmed_delivery":
      return "Seller Confirmed Delivery (Awaiting Payout)";
    case "meeting_scheduled": // NEW: Specific for Cash Exchange
      return "Meeting Scheduled";
    case "paid_to_seller":
    case "completed":
      return "Completed";
    case "failed":
      return "Cancelled";
    default:
      return "Pending";
  }
};

const convertAppwriteTransactionToTrackingItem = (doc: Models.Document, currentUserId: string): MarketTransactionItem => {
  const transactionDoc = doc as any;
  const isBuyer = transactionDoc.buyerId === currentUserId;
  const isCashExchange = transactionDoc.type === 'cash-exchange';

  let description = `Payment for ${transactionDoc.productTitle}`;
  let type: MarketTransactionItem["type"] = "Transaction";

  if (isCashExchange) {
    type = "Cash Exchange";
    description = isBuyer 
      ? `Accepted Exchange: ${transactionDoc.productTitle}` 
      : `Your Exchange Accepted: ${transactionDoc.productTitle}`;
  } else {
    if (isBuyer) {
      description = `Purchase of ${transactionDoc.productTitle}`;
    } else if (transactionDoc.sellerId === currentUserId) {
      description = `Sale of ${transactionDoc.productTitle}`;
    }
  }

  return {
    id: transactionDoc.$id,
    type: type,
    description: description,
    status: mapAppwriteStatusToTrackingStatus(transactionDoc.status),
    appwriteStatus: transactionDoc.status,
    date: new Date(transactionDoc.$createdAt).toLocaleDateString(),
    productTitle: transactionDoc.productTitle,
    amount: transactionDoc.amount,
    sellerName: transactionDoc.sellerName,
    buyerName: transactionDoc.buyerName,
    buyerId: transactionDoc.buyerId,
    sellerId: transactionDoc.sellerId,
    commissionAmount: transactionDoc.commissionAmount,
    netSellerAmount: transactionDoc.netSellerAmount,
    isUserProvider: transactionDoc.sellerId === currentUserId,
    collegeName: transactionDoc.collegeName,
    ambassadorDelivery: transactionDoc.ambassadorDelivery,
    ambassadorMessage: transactionDoc.ambassadorMessage,
  };
};

const convertAppwriteFoodOrderToTrackingItem = (doc: FoodOrder, currentUserId: string): FoodOrderItem => {
  const isBuyer = doc.buyerId === currentUserId;
  const description = isBuyer
    ? `Order placed for ${doc.offeringTitle}`
    : `Order received for ${doc.offeringTitle}`;

  return {
    id: doc.$id,
    type: "Food Order",
    description: description,
    status: doc.status,
    date: new Date(doc.$createdAt).toLocaleDateString(),
    offeringTitle: doc.offeringTitle,
    totalAmount: doc.totalAmount,
    providerName: doc.providerName,
    buyerName: doc.buyerName,
    buyerId: doc.buyerId,
    providerId: doc.providerId,
    orderStatus: doc.status,
    isUserProvider: doc.providerId === currentUserId,
    quantity: doc.quantity,
    deliveryLocation: doc.deliveryLocation,
    notes: doc.notes,
    collegeName: doc.collegeName,
    ambassadorDelivery: doc.ambassadorDelivery,
    ambassadorMessage: doc.ambassadorMessage,
  };
};

const TrackingPage = () => {
  const { user, userProfile } = useAuth();
  const { orders: foodOrders, isLoading: isLoadingFood, refetch: refetchFoodOrders } = useFoodOrders();

  const [trackingItems, setTrackingItems] = useState<TrackingItem[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchMarketTransactions = useCallback(async () => {
    if (!user?.$id || !userProfile?.collegeName) {
      setLoadingTransactions(false);
      return [];
    }

    setLoadingTransactions(true);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [
          Query.or([
            Query.equal('buyerId', user.$id),
            Query.equal('sellerId', user.$id)
          ]),
          Query.equal('collegeName', userProfile.collegeName),
          Query.orderDesc('$createdAt')
        ]
      );

      return response.documents.map((doc: Models.Document) => convertAppwriteTransactionToTrackingItem(doc, user.$id));
    } catch (error) {
      console.error("Error fetching market transactions:", error);
      toast.error("Failed to load market transactions.");
      return [];
    }
  }, [user?.$id, userProfile?.collegeName]);

  const mergeAndSetItems = useCallback(async () => {
    const fetchedTransactions = await fetchMarketTransactions();
    const foodOrderItems = foodOrders.map(o => convertAppwriteFoodOrderToTrackingItem(o, user!.$id));
    const mergedItems = [...fetchedTransactions, ...foodOrderItems];
    mergedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setTrackingItems(mergedItems);
    setLoadingTransactions(false);
  }, [fetchMarketTransactions, foodOrders, user]);

  useEffect(() => {
    if (user) {
      mergeAndSetItems();
    }
  }, [user, mergeAndSetItems]);

  // --- Status Update Handlers ---

  const handleUpdateFoodOrderStatus = async (orderId: string, currentStatus: FoodOrder["status"]) => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);

    let nextStatus: FoodOrder["status"];
    let successMessage: string;

    if (currentStatus === "Pending Confirmation") {
      nextStatus = "Confirmed";
      successMessage = "Order confirmed! Start preparing.";
    } else if (currentStatus === "Confirmed") {
      nextStatus = "Preparing";
      successMessage = "Order status updated to Preparing.";
    } else if (currentStatus === "Preparing") {
      nextStatus = "Out for Delivery";
      successMessage = "Order is out for delivery!";
    } else {
      setIsUpdatingStatus(false);
      return;
    }

    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        orderId,
        { status: nextStatus }
      );
      toast.success(successMessage);
      refetchFoodOrders();
    } catch (error: any) {
      console.error("Error updating order status:", error);
      toast.error(error.message || "Failed to update order status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);

    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        orderId,
        { status: "Delivered" }
      );
      toast.success("Delivery confirmed! Enjoy your meal.");
      refetchFoodOrders();
    } catch (error: any) {
      console.error("Error confirming delivery:", error);
      toast.error(error.message || "Failed to confirm delivery.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleMarkMarketItemDelivered = async (transactionId: string) => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);

    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        transactionId,
        { status: "seller_confirmed_delivery" }
      );
      toast.success("Delivery confirmed! Developer will process your payout shortly.");
      mergeAndSetItems(); // Refresh items
    } catch (error: any) {
      console.error("Error marking market item as delivered:", error);
      toast.error(error.message || "Failed to mark item as delivered.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // NEW: Handle completing cash exchange
  const handleCompleteCashExchange = async (transactionId: string) => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);

    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        transactionId,
        { status: "completed" }
      );
      toast.success("Exchange marked as completed!");
      mergeAndSetItems(); // Refresh items
    } catch (error: any) {
      console.error("Error completing exchange:", error);
      toast.error("Failed to complete exchange.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // --- UI Helpers ---

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Pending Confirmation":
      case "Initiated (Awaiting Payment)":
        return "bg-yellow-500 text-white";
      case "Payment Confirmed (Processing)":
      case "Confirmed":
      case "Meeting Scheduled": // NEW
        return "bg-blue-500 text-white";
      case "Commission Deducted (Awaiting Seller Pay)":
      case "Preparing":
        return "bg-orange-500 text-white";
      case "Out for Delivery":
      case "Seller Confirmed Delivery (Awaiting Payout)":
        return "bg-purple-500 text-white";
      case "Completed":
      case "Delivered":
        return "bg-green-500 text-white"; // Changed to consistent green
      case "Cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getIcon = (type: TrackingItem["type"]) => {
    switch (type) {
      case "Transaction":
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case "Food Order":
        return <Utensils className="h-4 w-4 text-red-500" />;
      case "Cash Exchange":
        return <Handshake className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const userLevel = userProfile?.level ?? 1;
  const dynamicCommissionRate = calculateCommissionRate(userLevel);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Tracking</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Your Activities (Real-time)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {(loadingTransactions || isLoadingFood) ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading your activities...</p>
              </div>
            ) : trackingItems.length > 0 ? (
              trackingItems.map((item) => {
                const isSellerOrProvider = item.isUserProvider;
                const marketItem = (item.type === "Transaction" || item.type === "Cash Exchange") ? (item as MarketTransactionItem) : null;
                const isCashExchange = item.type === "Cash Exchange";

                return (
                  <div key={item.id} className="flex flex-col space-y-3 p-3 border border-border rounded-md bg-background">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(item.type)}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-medium text-foreground truncate">{item.description}</p>
                        <p className="text-sm text-muted-foreground">{item.type} - {item.date}</p>
                        <Badge className={cn("mt-1", getStatusBadgeClass(item.status))}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>

                    {/* --- Market / Cash Exchange Details --- */}
                    {marketItem && (
                      <div className="space-y-1 text-xs border-t border-border pt-2">
                        <p className="text-muted-foreground">Amount: <span className="font-semibold text-foreground">₹{marketItem.amount?.toFixed(2)}</span></p>
                        
                        {/* Specific UI for Cash Exchange */}
                        {isCashExchange ? (
                            <div className="mt-2">
                                <p className="text-muted-foreground">Partner: {isSellerOrProvider ? marketItem.buyerName : marketItem.sellerName}</p>
                                <p className="text-blue-500 font-medium mt-1">{marketItem.ambassadorMessage}</p>
                                
                                {/* Button for Poster to Confirm Completion */}
                                {isSellerOrProvider && marketItem.appwriteStatus === 'meeting_scheduled' && (
                                    <Button
                                        size="sm"
                                        onClick={() => handleCompleteCashExchange(marketItem.id)}
                                        disabled={isUpdatingStatus}
                                        className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {isUpdatingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm Exchange Completed"}
                                    </Button>
                                )}
                            </div>
                        ) : (
                            // Standard Market Transaction UI
                            <>
                                {marketItem.ambassadorDelivery && (
                                <p className="text-muted-foreground flex items-center gap-1">
                                    <Truck className="h-3 w-3" /> Ambassador Delivery Requested
                                    {marketItem.ambassadorMessage && <span className="ml-1">({marketItem.ambassadorMessage})</span>}
                                </p>
                                )}
                                {isSellerOrProvider ? (
                                <>
                                    <p className="text-muted-foreground">Buyer: {marketItem.buyerName || "N/A"}</p>
                                    {marketItem.status === "Initiated (Awaiting Payment)" && (
                                    <p className="text-yellow-500">Awaiting buyer payment confirmation to developer.</p>
                                    )}
                                    {marketItem.status === "Payment Confirmed (Processing)" && (
                                    <p className="text-blue-500">Payment confirmed. Developer processing commission.</p>
                                    )}
                                    {marketItem.status === "Commission Deducted (Awaiting Seller Pay)" && (
                                    <p className="text-orange-500">
                                        Commission deducted. Awaiting payout: ₹{marketItem.netSellerAmount?.toFixed(2)}.
                                    </p>
                                    )}
                                    {marketItem.status === "Seller Confirmed Delivery (Awaiting Payout)" && (
                                    <p className="text-purple-500">
                                        You confirmed delivery. Awaiting payout.
                                    </p>
                                    )}
                                    
                                    {/* Seller Action: Confirm Delivery */}
                                    {marketItem.status === "Commission Deducted (Awaiting Seller Pay)" && (
                                    <div className="flex justify-end mt-2">
                                        <Button
                                        size="sm"
                                        onClick={() => handleMarkMarketItemDelivered(marketItem.id)}
                                        disabled={isUpdatingStatus}
                                        className="bg-green-500 text-white hover:bg-green-600 text-xs"
                                        >
                                        <CheckCircle className="h-3 w-3 mr-1" /> Mark as Delivered
                                        </Button>
                                    </div>
                                    )}
                                </>
                                ) : (
                                <p className="text-muted-foreground">Seller: {marketItem.sellerName || "N/A"}</p>
                                )}
                            </>
                        )}
                      </div>
                    )}

                    {/* --- Food Order Details --- */}
                    {item.type === "Food Order" && (
                      <div className="space-y-2 border-t border-border pt-2">
                        <p className="text-xs text-muted-foreground">Total: <span className="font-semibold text-foreground">₹{item.totalAmount.toFixed(2)}</span></p>
                        <p className="text-xs text-muted-foreground">Delivery to: {item.deliveryLocation}</p>
                        
                        {/* Provider Actions */}
                        {isSellerOrProvider && item.orderStatus !== "Delivered" && item.orderStatus !== "Cancelled" && (
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateFoodOrderStatus(item.id, item.orderStatus)}
                              disabled={isUpdatingStatus}
                              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                            >
                              {item.orderStatus === "Pending Confirmation" && "Confirm Order"}
                              {item.orderStatus === "Confirmed" && "Start Preparing"}
                              {item.orderStatus === "Preparing" && "Mark Out for Delivery"}
                              {item.orderStatus === "Out for Delivery" && "Awaiting Buyer Confirmation"}
                            </Button>
                          </div>
                        )}

                        {/* Buyer Actions */}
                        {!isSellerOrProvider && item.orderStatus === "Out for Delivery" && (
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => handleConfirmDelivery(item.id)}
                              disabled={isUpdatingStatus}
                              className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 text-xs"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" /> Confirm Delivery
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-4">No activities to track yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default TrackingPage;