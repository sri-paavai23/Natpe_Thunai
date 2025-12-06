"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, ShoppingCart, Wrench, MessageSquareWarning, XCircle } from "lucide-react";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID, APPWRITE_SERVICE_REQUESTS_COLLECTION_ID } from "@/lib/appwrite"; // Fixed: Corrected import
import { Query, Models } from "appwrite";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Transaction extends Models.Document {
  productId: string;
  productTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  amount: number;
  status: string; // e.g., "Pending", "Completed", "Cancelled"
  type: "buy" | "rent" | "service"; // Added type for filtering
  isBargain: boolean;
  // Add other relevant fields like UTR ID, payment proof, etc.
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
  status: string; // e.g., "Pending Confirmation", "Confirmed", "Preparing", "Out for Delivery", "Delivered", "Cancelled"
}

interface ServiceRequest extends Models.Document {
  serviceId: string;
  serviceTitle: string;
  providerId: string;
  providerName: string;
  requesterId: string;
  requesterName: string;
  status: string; // e.g., "Pending", "Accepted", "Rejected", "Completed", "Cancelled"
  requestDetails: string;
  proposedPrice: number;
  // Add other relevant fields
}

const TrackingPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"purchases" | "sales" | "foodOrders" | "serviceRequests">("purchases");
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Transaction[]>([]);
  const [sales, setSales] = useState<Transaction[]>([]);
  const [foodOrders, setFoodOrders] = useState<FoodOrder[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);

  const fetchTrackingData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch Purchases (where user is buyer)
      const purchasesResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [Query.equal("buyerId", user.$id), Query.orderDesc('$createdAt')]
      );
      setPurchases(purchasesResponse.documents as unknown as Transaction[]);

      // Fetch Sales (where user is seller)
      const salesResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [Query.equal("sellerId", user.$id), Query.orderDesc('$createdAt')]
      );
      setSales(salesResponse.documents as unknown as Transaction[]);

      // Fetch Food Orders (where user is buyer)
      const foodOrdersResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        [Query.equal("buyerId", user.$id), Query.orderDesc('$createdAt')]
      );
      setFoodOrders(foodOrdersResponse.documents as unknown as FoodOrder[]);

      // Fetch Service Requests (where user is requester)
      const serviceRequestsResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICE_REQUESTS_COLLECTION_ID,
        [Query.equal("requesterId", user.$id), Query.orderDesc('$createdAt')]
      );
      setServiceRequests(serviceRequestsResponse.documents as unknown as ServiceRequest[]);

    } catch (error) {
      console.error("Error fetching tracking data:", error);
      toast.error("Failed to load tracking data.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTrackingData();

    // Realtime subscriptions (simplified for brevity, would need more specific handling for each collection)
    const unsubscribeTransactions = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TRANSACTIONS_COLLECTION_ID}.documents`,
      (response) => {
        // Re-fetch all data on any transaction change for simplicity
        fetchTrackingData();
      }
    );
    const unsubscribeFoodOrders = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_FOOD_ORDERS_COLLECTION_ID}.documents`,
      (response) => {
        fetchTrackingData();
      }
    );
    const unsubscribeServiceRequests = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_SERVICE_REQUESTS_COLLECTION_ID}.documents`,
      (response) => {
        fetchTrackingData();
      }
    );

    return () => {
      unsubscribeTransactions();
      unsubscribeFoodOrders();
      unsubscribeServiceRequests();
    };
  }, [fetchTrackingData]);

  const renderEmptyState = (message: string) => (
    <p className="text-center text-muted-foreground py-8">{message}</p>
  );

  const renderLoadingState = () => (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
      <p className="ml-3 text-muted-foreground">Loading your activities...</p>
    </div>
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Completed":
      case "Delivered":
      case "Accepted":
        return "bg-green-500 text-white";
      case "Pending":
      case "Pending Confirmation":
      case "Confirmed":
      case "Preparing":
      case "Out for Delivery":
        return "bg-orange-500 text-white";
      case "Cancelled":
      case "Rejected":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const renderPurchases = () => {
    if (loading) return renderLoadingState();
    if (purchases.length === 0) return renderEmptyState("No purchases found.");

    return purchases.map((item) => (
      <Card key={item.$id} className="bg-card border-border p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-secondary-neon" /> {item.productTitle}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Seller: {item.sellerName}</p>
          <p className="text-sm text-muted-foreground">Amount: ₹{item.amount.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Type: {item.type.charAt(0).toUpperCase() + item.type.slice(1)}</p>
        </div>
        <Badge className={cn("mt-2 sm:mt-0", getStatusBadgeClass(item.status))}>{item.status}</Badge>
      </Card>
    ));
  };

  const renderSales = () => {
    if (loading) return renderLoadingState();
    if (sales.length === 0) return renderEmptyState("No sales found.");

    return sales.map((item) => (
      <Card key={item.$id} className="bg-card border-border p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="h-4 w-4 text-secondary-neon" /> {item.productTitle}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Buyer: {item.buyerName}</p>
          <p className="text-sm text-muted-foreground">Amount: ₹{item.amount.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Type: {item.type.charAt(0).toUpperCase() + item.type.slice(1)}</p>
        </div>
        <Badge className={cn("mt-2 sm:mt-0", getStatusBadgeClass(item.status))}>{item.status}</Badge>
      </Card>
    ));
  };

  const renderFoodOrders = () => {
    if (loading) return renderLoadingState();
    if (foodOrders.length === 0) return renderEmptyState("No food orders found.");

    return foodOrders.map((item) => (
      <Card key={item.$id} className="bg-card border-border p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-secondary-neon" /> {item.offeringTitle} (x{item.quantity})
          </CardTitle>
          <p className="text-sm text-muted-foreground">Provider: {item.providerName}</p>
          <p className="text-sm text-muted-foreground">Total: ₹{item.totalAmount.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Delivery: {item.deliveryLocation}</p>
        </div>
        <Badge className={cn("mt-2 sm:mt-0", getStatusBadgeClass(item.status))}>{item.status}</Badge>
      </Card>
    ));
  };

  const renderServiceRequests = () => {
    if (loading) return renderLoadingState();
    if (serviceRequests.length === 0) return renderEmptyState("No service requests found.");

    return serviceRequests.map((item) => (
      <Card key={item.$id} className="bg-card border-border p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Wrench className="h-4 w-4 text-secondary-neon" /> {item.serviceTitle}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Provider: {item.providerName}</p>
          <p className="text-sm text-muted-foreground">Proposed Price: ₹{item.proposedPrice.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Details: {item.requestDetails.substring(0, 50)}...</p>
        </div>
        <Badge className={cn("mt-2 sm:mt-0", getStatusBadgeClass(item.status))}>{item.status}</Badge>
      </Card>
    ));
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Your Activities</h1>
      <div className="max-w-2xl mx-auto space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "purchases" | "sales" | "foodOrders" | "serviceRequests")} className="w-full">
          {/* Updated TabsList for mobile responsiveness */}
          <TabsList className="flex w-full overflow-x-auto whitespace-nowrap bg-primary-blue-light text-primary-foreground h-auto p-1">
            <TabsTrigger value="purchases" className="flex-shrink-0 min-w-[120px] text-xs sm:text-sm data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Purchases</TabsTrigger>
            <TabsTrigger value="sales" className="flex-shrink-0 min-w-[120px] text-xs sm:text-sm data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Sales</TabsTrigger>
            <TabsTrigger value="foodOrders" className="flex-shrink-0 min-w-[120px] text-xs sm:text-sm data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Food Orders</TabsTrigger>
            <TabsTrigger value="serviceRequests" className="flex-shrink-0 min-w-[120px] text-xs sm:text-sm data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Service Requests</TabsTrigger>
          </TabsList>
          <div className="mt-4 space-y-4">
            <TabsContent value="purchases" className="space-y-3">
              {renderPurchases()}
            </TabsContent>
            <TabsContent value="sales" className="space-y-3">
              {renderSales()}
            </TabsContent>
            <TabsContent value="foodOrders" className="space-y-3">
              {renderFoodOrders()}
            </TabsContent>
            <TabsContent value="serviceRequests" className="space-y-3">
              {renderServiceRequests()}
            </TabsContent>
          </div>
        </Tabs>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default TrackingPage;