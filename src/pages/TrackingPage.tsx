"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, XCircle, MessageSquareText, DollarSign, Loader2, Utensils, CheckCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Models, Query } from "appwrite";
import { calculateCommissionRate } from "@/utils/commission";
import { useFoodOrders, FoodOrder } from "@/hooks/useFoodOrders"; // NEW IMPORT
import { Button } from "@/components/ui/button";

// --- Tracking Item Interfaces ---

interface BaseTrackingItem {
  id: string;
  description: string;
  date: string;
  status: string; // Generic status string
  isUserProvider: boolean;
}

export interface MarketTransactionItem extends BaseTrackingItem {
  type: "Transaction";
  productTitle: string;
  amount: number;
  sellerName: string;
  buyerName: string;
  buyerId: string;
  sellerId: string;
  commissionAmount?: number;
  netSellerAmount?: number;
  collegeName: string; // NEW: Add collegeName
}

export interface FoodOrderItem extends BaseTrackingItem {
  type: "Food Order";
  offeringTitle: string;
  totalAmount: number;
  providerName: string;
  buyerName: string;
  buyerId: string;
  providerId: string;
  orderStatus: FoodOrder["status"]; // Specific status for food orders
  quantity: number;
  deliveryLocation: string; // Added missing property
  notes: string; // Added missing property
  collegeName: string; // NEW: Add collegeName
}

interface OtherActivityItem extends BaseTrackingItem {
  type: "Order" | "Service" | "Cancellation" | "Complaint";
}

type TrackingItem = MarketTransactionItem | FoodOrderItem | OtherActivityItem;

// --- Conversion Functions ---

// Helper function to map Appwrite transaction status to TrackingItem status
const mapAppwriteStatusToTrackingStatus = (appwriteStatus: string): string => {
  switch (appwriteStatus) {
    case "initiated":
      return "Initiated (Awaiting Payment)";
    case "payment_confirmed_to_developer":
      return "Payment Confirmed (Processing)";
    case "commission_deducted":
      return "Commission Deducted (Awaiting Seller Pay)";
    case "paid_to_seller":
      return "Completed";
    case "failed":
      return "Cancelled";
    default:
      return "Pending";
  }
};

// Helper function to convert Appwrite transaction document to TrackingItem
const convertAppwriteTransactionToTrackingItem = (doc: Models.Document, currentUserId: string): MarketTransactionItem => {
  const transactionDoc = doc as any;
  const isBuyer = transactionDoc.buyerId === currentUserId;

  let description = `Payment for ${transactionDoc.productTitle}`;
  if (isBuyer) {
    description = `Purchase of ${transactionDoc.productTitle}`;
  } else if (transactionDoc.sellerId === currentUserId) {
    description = `Sale of ${transactionDoc.productTitle}`;
  }

  return {
    id: transactionDoc.$id,
    type: "Transaction",
    description: description,
    status: mapAppwriteStatusToTrackingStatus(transactionDoc.status),
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
    collegeName: transactionDoc.collegeName, // NEW: Add collegeName
  };
};

// New conversion function for Food Orders
const convertAppwriteFoodOrderToTrackingItem = (doc: FoodOrder, currentUserId: string): FoodOrderItem => {
  const isBuyer = doc.buyerId === currentUserId;
  const description = isBuyer 
    ? `Order placed for ${doc.offeringTitle}` 
    : `Order received for ${doc.offeringTitle}`;

  return {
    id: doc.$id,
    type: "Food Order",
    description: description,
    status: doc.status, // Use specific order status
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
    deliveryLocation: doc.deliveryLocation, // Mapped missing property
    notes: doc.notes, // Mapped missing property
    collegeName: doc.collegeName, // NEW: Add collegeName
  };
};

const dummyOtherItems: OtherActivityItem[] = [
  { id: "t1", type: "Order", description: "Gaming Headset from The Exchange", status: "In Progress", date: "2024-07-20", isUserProvider: false },
  { id: "t2", type: "Service", description: "Resume Building Service", status: "Completed", date: "2024-07-18", isUserProvider: false },
  { id: "t3", type: "Cancellation", description: "Rent request for Bicycle", status: "Pending", date: "2024-07-22", isUserProvider: false },
  { id: "t4", type: "Complaint", description: "Issue with food delivery", status: "Resolved", date: "2024-07-15", isUserProvider: false },
  { id: "t5", type: "Order", description: "Textbook: Advanced Physics", status: "Pending", date: "2024-07-23", isUserProvider: false },
];


const TrackingPage = () => {
  const { user, userProfile } = useAuth();
  const { orders: foodOrders, isLoading: isLoadingFood, refetch: refetchFoodOrders } = useFoodOrders();
  
  const [trackingItems, setTrackingItems] = useState<TrackingItem[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchMarketTransactions = useCallback(async () => {
    if (!user?.$id || !userProfile?.collegeName) { // NEW: Only fetch if user and collegeName are available
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
          Query.equal('collegeName', userProfile.collegeName), // NEW: Filter by collegeName
          Query.orderDesc('$createdAt')
        ]
      );

      return response.documents.map((doc: Models.Document) => convertAppwriteTransactionToTrackingItem(doc, user.$id));
    } catch (error) {
      console.error("Error fetching market transactions:", error);
      toast.error("Failed to load market transactions.");
      return [];
    }
  }, [user?.$id, userProfile?.collegeName]); // NEW: Depend on userProfile.collegeName

  const mergeAndSetItems = useCallback(async () => {
    const fetchedTransactions = await fetchMarketTransactions();
    
    // foodOrders is already filtered by collegeName internally by useFoodOrders hook
    const foodOrderItems = foodOrders.map(o => convertAppwriteFoodOrderToTrackingItem(o, user!.$id));

    // Filter dummy items by collegeName (assuming dummy items also have a collegeName or are global)
    // For now, we'll assume dummy items are global or don't have collegeName, so they won't be filtered.
    // In a real scenario, dummy items should also have a collegeName attribute.
    const collegeFilteredDummyItems = dummyOtherItems; // No collegeName on dummy items, so they are "global" for now.
    
    const mergedItems = [...fetchedTransactions, ...foodOrderItems, ...collegeFilteredDummyItems];
    
    // Sort by creation date (newest first)
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
      refetchFoodOrders(); // Trigger refetch to update local state immediately
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

  // --- UI Helpers ---

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Pending Confirmation":
      case "Initiated (Awaiting Payment)":
        return "bg-yellow-500 text-white";
      case "Payment Confirmed (Processing)":
      case "Confirmed":
        return "bg-blue-500 text-white";
      case "Commission Deducted (Awaiting Seller Pay)":
      case "Preparing":
        return "bg-orange-500 text-white";
      case "Out for Delivery":
        return "bg-purple-500 text-white";
      case "Completed":
      case "Delivered":
      case "Resolved":
        return "bg-secondary-neon text-primary-foreground";
      case "Cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getIcon = (type: TrackingItem["type"]) => {
    switch (type) {
      case "Order":
        return <Package className="h-4 w-4 text-secondary-neon" />;
      case "Service":
        return <Truck className="h-4 w-4 text-secondary-neon" />;
      case "Cancellation":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "Complaint":
        return <MessageSquareText className="h-4 w-4 text-yellow-500" />;
      case "Transaction":
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case "Food Order":
        return <Utensils className="h-4 w-4 text-red-500" />;
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
                const commissionRateDisplay = (dynamicCommissionRate * 100).toFixed(2);
                
                // Determine if it's a Food Order for specific logic
                const isFoodOrder = item.type === "Food Order";
                const foodItem = isFoodOrder ? (item as FoodOrderItem) : null;

                // Calculate expected net amount if commission hasn't been deducted yet (Market only)
                const marketItem = item.type === "Transaction" ? (item as MarketTransactionItem) : null;
                
                // Use dynamicCommissionRate for calculation if commissionAmount/netSellerAmount are missing (i.e., status is 'initiated' or 'payment_confirmed_to_developer')
                const expectedCommission = marketItem?.amount ? marketItem.amount * dynamicCommissionRate : 0;
                const expectedNet = marketItem?.amount ? marketItem.amount - expectedCommission : 0;

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

                    {/* --- Market Transaction Details --- */}
                    {marketItem && (
                      <div className="space-y-1 text-xs border-t border-border pt-2">
                        <p className="text-muted-foreground">Amount: <span className="font-semibold text-foreground">₹{marketItem.amount?.toFixed(2)}</span></p>
                        {isSellerOrProvider ? (
                          <>
                            <p className="text-muted-foreground">Buyer: {marketItem.buyerName || "N/A"}</p>
                            {marketItem.status === "Initiated (Awaiting Payment)" && (
                              <p className="text-yellow-500">Awaiting buyer payment confirmation to developer.</p>
                            )}
                            {marketItem.status === "Payment Confirmed (Processing)" && (
                              <p className="text-blue-500">Payment confirmed by buyer. Developer processing commission ({commissionRateDisplay}%).</p>
                            )}
                            {marketItem.status === "Commission Deducted (Awaiting Seller Pay)" && (
                              <p className="text-orange-500">
                                Commission deducted (₹{marketItem.commissionAmount?.toFixed(2) || expectedCommission.toFixed(2)}). 
                                Awaiting transfer of net amount: ₹{marketItem.netSellerAmount?.toFixed(2) || expectedNet.toFixed(2)}.
                              </p>
                            )}
                            {marketItem.status === "Completed" && (
                              <p className="text-green-500">Payment complete. Net amount ₹{marketItem.netSellerAmount?.toFixed(2)} transferred.</p>
                            )}
                          </>
                        ) : (
                          <p className="text-muted-foreground">Seller: {marketItem.sellerName || "N/A"}</p>
                        )}
                      </div>
                    )}

                    {/* --- Food Order Details & Actions --- */}
                    {foodItem && (
                      <div className="space-y-2 border-t border-border pt-2">
                        <p className="text-xs text-muted-foreground">Total: <span className="font-semibold text-foreground">₹{foodItem.totalAmount.toFixed(2)}</span> | Qty: {foodItem.quantity}</p>
                        <p className="text-xs text-muted-foreground">Delivery to: {foodItem.deliveryLocation}</p>
                        {foodItem.notes && <p className="text-xs text-muted-foreground">Notes: {foodItem.notes}</p>}
                        
                        {/* Provider Actions */}
                        {isSellerOrProvider && foodItem.orderStatus !== "Delivered" && foodItem.orderStatus !== "Cancelled" && (
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateFoodOrderStatus(foodItem.id, foodItem.orderStatus)}
                              disabled={isUpdatingStatus}
                              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
                            >
                              {isUpdatingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                <>
                                  <ArrowRight className="h-3 w-3 mr-1" /> 
                                  {foodItem.orderStatus === "Pending Confirmation" && "Confirm Order"}
                                  {foodItem.orderStatus === "Confirmed" && "Start Preparing"}
                                  {foodItem.orderStatus === "Preparing" && "Mark Out for Delivery"}
                                  {foodItem.orderStatus === "Out for Delivery" && "Awaiting Buyer Confirmation"}
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {/* Buyer Actions */}
                        {!isSellerOrProvider && foodItem.orderStatus === "Out for Delivery" && (
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => handleConfirmDelivery(foodItem.id)}
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
              <p className="text-center text-muted-foreground py-4">No activities to track yet for your college.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default TrackingPage;