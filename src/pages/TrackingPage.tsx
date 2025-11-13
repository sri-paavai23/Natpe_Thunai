"use client";

import React, { useEffect, useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, XCircle, MessageSquareText, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Models, Query } from "appwrite"; // Import Models and Query

interface TrackingItem {
  id: string;
  type: "Order" | "Service" | "Cancellation" | "Complaint" | "Transaction";
  description: string;
  status: "Pending" | "In Progress" | "Completed" | "Cancelled" | "Resolved" | "Initiated" | "Payment Confirmed";
  date: string;
  productTitle?: string;
  amount?: number;
  sellerName?: string;
  buyerId?: string;
  sellerId?: string;
}

// Helper function to map Appwrite transaction status to TrackingItem status
const mapAppwriteStatusToTrackingStatus = (appwriteStatus: string): TrackingItem["status"] => {
  switch (appwriteStatus) {
    case "initiated":
      return "Initiated";
    case "payment_confirmed_to_developer":
    case "commission_deducted": // Both are "In Progress" from user's perspective
      return "In Progress";
    case "paid_to_seller":
      return "Completed";
    case "failed":
      return "Cancelled";
    default:
      return "Pending";
  }
};

// Helper function to convert Appwrite transaction document to TrackingItem
const convertAppwriteTransactionToTrackingItem = (doc: Models.Document, currentUserId: string): TrackingItem => {
  const transactionDoc = doc as any; // Cast to any for easier property access
  const isBuyer = transactionDoc.buyerId === currentUserId;
  const isSeller = transactionDoc.sellerId === currentUserId;

  let description = `Payment for ${transactionDoc.productTitle}`;
  if (isBuyer) {
    description = `Purchase of ${transactionDoc.productTitle}`;
  } else if (isSeller) {
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
    buyerId: transactionDoc.buyerId,
    sellerId: transactionDoc.sellerId,
  };
};


const TrackingPage = () => {
  const { user } = useAuth();
  const [trackingItems, setTrackingItems] = useState<TrackingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrackingItems = async () => {
      if (!user?.$id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch transactions where the current user is the buyer or seller
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_TRANSACTIONS_COLLECTION_ID,
          [
            Query.or([
              Query.equal('buyerId', user.$id),
              Query.equal('sellerId', user.$id)
            ])
          ]
        );

        const fetchedTransactions: TrackingItem[] = response.documents
          .map((doc: Models.Document) => convertAppwriteTransactionToTrackingItem(doc, user.$id));

        const dummyOtherItems: TrackingItem[] = [
          { id: "t1", type: "Order", description: "Gaming Headset from The Exchange", status: "In Progress", date: "2024-07-20" },
          { id: "t2", type: "Service", description: "Resume Building Service", status: "Completed", date: "2024-07-18" },
          { id: "t3", type: "Cancellation", description: "Rent request for Bicycle", status: "Pending", date: "2024-07-22" },
          { id: "t4", type: "Complaint", description: "Issue with food delivery", status: "Resolved", date: "2024-07-15" },
          { id: "t5", type: "Order", description: "Textbook: Advanced Physics", status: "Pending", date: "2024-07-23" },
        ];

        setTrackingItems([...fetchedTransactions, ...dummyOtherItems]);
      } catch (error) {
        console.error("Error fetching tracking items:", error);
        toast.error("Failed to load tracking items. Please check your network and Appwrite permissions.");
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingItems();

    // Realtime subscription for transactions
    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TRANSACTIONS_COLLECTION_ID}.documents`,
      (response) => {
        if (!user?.$id) return; // Ensure user is logged in for real-time updates

        const payload = response.payload as unknown as Models.Document;
        const transactionPayload = payload as any;

        // Only process if the current user is involved in the transaction
        if (transactionPayload.buyerId !== user.$id && transactionPayload.sellerId !== user.$id) {
          return;
        }

        const newTrackingItem = convertAppwriteTransactionToTrackingItem(payload, user.$id);

        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          setTrackingItems((prev) => [newTrackingItem, ...prev]);
          toast.info(`New activity: "${newTrackingItem.description}"`);
        } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          setTrackingItems((prev) =>
            prev.map((item) =>
              item.id === newTrackingItem.id ? newTrackingItem : item
            )
          );
          toast.info(`Activity updated: "${newTrackingItem.description}" status is now "${newTrackingItem.status}"`);
        } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
          setTrackingItems((prev) => prev.filter((item) => item.id !== newTrackingItem.id));
          toast.info(`Activity removed: "${newTrackingItem.description}"`);
        }
      }
    );

    return () => {
      unsubscribe(); // Unsubscribe on component unmount
    };
  }, [user]); // Depend on user to re-run effect if user changes

  const getStatusBadgeClass = (status: TrackingItem["status"]) => {
    switch (status) {
      case "Pending":
      case "Initiated":
        return "bg-yellow-500 text-white";
      case "In Progress":
        return "bg-blue-500 text-white";
      case "Completed":
      case "Resolved":
      case "Payment Confirmed":
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
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Tracking</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Your Activities</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {loading ? (
              <p className="text-center text-muted-foreground py-4">Loading your activities...</p>
            ) : trackingItems.length > 0 ? (
              trackingItems.map((item) => (
                <div key={item.id} className="flex items-start space-x-3 p-3 border border-border rounded-md bg-background">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <p className="font-medium text-foreground truncate">{item.description}</p>
                    {item.type === "Transaction" && (
                      <>
                        <p className="text-sm text-muted-foreground">Amount: ₹{item.amount?.toFixed(2)}</p>
                        {item.buyerId === user?.$id ? (
                          <p className="text-xs text-muted-foreground truncate">You are the buyer. Seller: {item.sellerName || "N/A"}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground truncate">You are the seller. Buyer: {item.buyerId || "N/A"}</p>
                        )}
                        {item.status === "Initiated" && (
                          <p className="text-xs text-yellow-500">Awaiting payment confirmation from developer.</p>
                        )}
                        {item.status === "In Progress" && item.sellerId === user?.$id && (
                          <p className="text-xs text-blue-500">Developer is processing payment. You will receive ₹{(item.amount || 0) * 0.70} (after 30% commission).</p>
                        )}
                      </>
                    )}
                    <p className="text-sm text-muted-foreground">{item.type} - {item.date}</p>
                    <Badge className={cn("mt-1", getStatusBadgeClass(item.status))}>
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))
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