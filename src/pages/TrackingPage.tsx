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
        // Fetch transactions where the current user is the buyer
        const buyerTransactionsResponse = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_TRANSACTIONS_COLLECTION_ID,
          [Query.equal('buyerId', user.$id)]
        );

        // Fetch transactions where the current user is the seller
        const sellerTransactionsResponse = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_TRANSACTIONS_COLLECTION_ID,
          [Query.equal('sellerId', user.$id)]
        );

        // Combine and deduplicate transactions
        const allTransactions = [...buyerTransactionsResponse.documents, ...sellerTransactionsResponse.documents];
        const uniqueTransactions = Array.from(new Map(allTransactions.map(item => [item.$id, item])).values());


        const fetchedTransactions: TrackingItem[] = uniqueTransactions
          .map((doc: Models.Document) => ({
            id: doc.$id,
            type: "Transaction",
            description: `Payment for ${(doc as any).productTitle}`,
            status: (doc as any).status === "initiated" ? "Initiated" :
                    (doc as any).status === "payment_confirmed_to_developer" ? "In Progress" :
                    (doc as any).status === "commission_deducted" ? "In Progress" :
                    (doc as any).status === "paid_to_seller" ? "Completed" :
                    (doc as any).status === "failed" ? "Cancelled" :
                    "Pending", // Default fallback
            date: new Date(doc.$createdAt).toLocaleDateString(),
            productTitle: (doc as any).productTitle,
            amount: (doc as any).amount,
            sellerName: (doc as any).sellerName,
            buyerId: (doc as any).buyerId,
            sellerId: (doc as any).sellerId,
          }));

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
  }, [user]);

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
                  <div className="flex-grow">
                    <p className="font-medium text-foreground">{item.description}</p>
                    {item.type === "Transaction" && (
                      <>
                        <p className="text-sm text-muted-foreground">Amount: ₹{item.amount?.toFixed(2)}</p>
                        {item.buyerId === user?.$id ? (
                          <p className="text-xs text-muted-foreground">You are the buyer. Seller: {item.sellerName || "N/A"}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">You are the seller. Buyer: {item.buyerId || "N/A"}</p>
                        )}
                        {item.status === "Initiated" && (
                          <p className="text-xs text-yellow-500">Awaiting payment confirmation from developer.</p>
                        )}
                        {item.status === "Payment Confirmed" && item.sellerId === user?.$id && (
                          <p className="text-xs text-green-500">Developer will pay you ₹{(item.amount || 0) * 0.70} (after 30% commission).</p>
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