"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, DollarSign, Loader2, Utensils, CheckCircle, 
  ArrowRight, Handshake, Clock, Package, ShoppingBag, 
  ChevronRight, AlertCircle, History, Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Models, Query } from "appwrite";
import { useFoodOrders, FoodOrder } from "@/hooks/useFoodOrders";

// --- INTERFACES ---

export interface BaseTrackingItem {
  id: string;
  description: string;
  date: string;
  status: string;
  isUserProvider: boolean; // True if user is Seller/Chef/Provider
  timestamp: number; // For sorting
  ambassadorDelivery?: boolean; // Added to base to solve property access error
  ambassadorMessage?: string;   // Added to base
}

export interface MarketTransactionItem extends BaseTrackingItem {
  type: "Transaction" | "Cash Exchange" | "Service" | "Errand" | "Collaboration";
  productTitle: string;
  amount: number;
  sellerName: string;
  buyerName: string;
  sellerId: string; // Added
  buyerId: string;  // Added
  netSellerAmount?: number; // Added
  collegeName: string;
  appwriteStatus: string;
}

export interface FoodOrderItem extends BaseTrackingItem {
  type: "Food Order";
  offeringTitle: string;
  totalAmount: number;
  providerName: string;
  buyerName: string;
  providerId: string; // Added
  buyerId: string;    // Added
  deliveryLocation: string;
  quantity: number;
  orderStatus: FoodOrder["status"];
  collegeName: string;
}

export type TrackingItem = MarketTransactionItem | FoodOrderItem;

// --- UTILS ---
const mapAppwriteStatusToTrackingStatus = (status: string): string => {
  const map: Record<string, string> = {
    "initiated": "Payment Pending",
    "payment_confirmed_to_developer": "Processing",
    "commission_deducted": "Active",
    "seller_confirmed_delivery": "Delivered",
    "meeting_scheduled": "Meeting Set",
    "negotiating": "In Discussion",
    "applied": "Application Sent",
    "paid_to_seller": "Completed",
    "completed": "Completed",
    "failed": "Cancelled"
  };
  return map[status] || "Pending";
};

// --- COMPONENT: STATUS STEPPER ---
const StatusStepper = ({ status, type }: { status: string, type: string }) => {
  let steps = [];
  let currentStep = 0;

  if (type === "Food Order") {
    steps = ["Ordered", "Confirmed", "Cooking", "Out for Delivery", "Delivered"];
    const statusMap: Record<string, number> = {
      "Pending Confirmation": 0, "Confirmed": 1, "Preparing": 2, "Out for Delivery": 3, "Delivered": 4
    };
    currentStep = statusMap[status] ?? 0;
  } else {
    steps = ["Initiated", "Active", "Delivered", "Completed"];
    const statusMap: Record<string, number> = {
      "Payment Pending": 0, "Processing": 1, "Active": 1, "Delivered": 2, "Completed": 3
    };
    currentStep = statusMap[status] ?? 0;
  }

  return (
    <div className="flex items-center w-full mt-3 mb-2">
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-center flex-1 last:flex-none">
          <div className={cn(
            "h-2 w-full rounded-full transition-all duration-500 mr-1",
            idx <= currentStep ? "bg-secondary-neon" : "bg-muted"
          )} />
        </div>
      ))}
      <span className="ml-2 text-[10px] font-bold text-secondary-neon uppercase tracking-wider">
        {steps[currentStep]}
      </span>
    </div>
  );
};

// --- COMPONENT: TRACKING CARD ---
const TrackingCard = ({ item, onAction }: { item: TrackingItem, onAction: (action: string, id: string) => void }) => {
  
  const getIcon = () => {
    switch (item.type) {
      case "Transaction": return <ShoppingBag className="h-5 w-5 text-blue-500" />;
      case "Food Order": return <Utensils className="h-5 w-5 text-orange-500" />;
      case "Cash Exchange": return <DollarSign className="h-5 w-5 text-green-500" />;
      case "Collaboration": return <Handshake className="h-5 w-5 text-purple-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const isCompleted = item.status === "Completed" || item.status === "Delivered" || item.status === "Cancelled";

  return (
    <Card className={cn(
      "border-l-4 transition-all hover:shadow-md bg-card",
      isCompleted ? "border-l-muted border-border opacity-80" : "border-l-secondary-neon border-border shadow-sm"
    )}>
      <CardContent className="p-4">
        
        {/* Header Row */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted/50 rounded-full border border-border">
              {getIcon()}
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground leading-tight">
                {item.type === 'Food Order' ? item.offeringTitle : item.productTitle}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                {item.type} • {item.date}
              </p>
            </div>
          </div>
          <Badge variant={isCompleted ? "secondary" : "outline"} className={cn(
            "text-[10px] font-bold uppercase",
            !isCompleted && "border-secondary-neon text-secondary-neon bg-secondary-neon/10"
          )}>
            {item.status}
          </Badge>
        </div>

        {/* Status Visualizer (Only for Active) */}
        {!isCompleted && <StatusStepper status={item.status === "Initiated (Awaiting Payment)" ? "Payment Pending" : (item as any).orderStatus || mapAppwriteStatusToTrackingStatus((item as any).appwriteStatus)} type={item.type} />}

        {/* Details Row */}
        <div className="bg-muted/30 p-3 rounded-md text-xs space-y-1 mt-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role:</span>
            <span className="font-medium">{item.isUserProvider ? "Seller / Provider" : "Buyer / Client"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Partner:</span>
            <span className="font-medium">
              {item.isUserProvider ? item.buyerName : (item.type === 'Food Order' ? item.providerName : item.sellerName)}
            </span>
          </div>
          {(item.type === 'Food Order' || item.type === 'Transaction') && (
             <div className="flex justify-between border-t border-border/50 pt-1 mt-1">
               <span className="text-muted-foreground font-bold">Amount:</span>
               <span className="font-bold text-foreground">
                 ₹{item.type === 'Food Order' ? item.totalAmount : item.amount}
               </span>
             </div>
          )}
          {item.ambassadorDelivery && (
             <div className="flex items-center gap-1 text-blue-500 pt-1">
                <Truck className="h-3 w-3" /> Ambassador Delivery Active
             </div>
          )}
        </div>

        {/* Action Buttons (Dynamic based on state) */}
        {!isCompleted && (
          <div className="mt-3 flex justify-end gap-2">
            
            {/* Food Order Actions */}
            {item.type === "Food Order" && item.isUserProvider && (item as any).orderStatus === "Pending Confirmation" && (
                <Button size="sm" className="h-8 text-xs bg-primary" onClick={() => onAction("confirm_food", item.id)}>Accept Order</Button>
            )}
            {item.type === "Food Order" && item.isUserProvider && (item as any).orderStatus === "Confirmed" && (
                <Button size="sm" className="h-8 text-xs bg-orange-500 text-white hover:bg-orange-600" onClick={() => onAction("update_food", item.id)}>Start Cooking</Button>
            )}
            {item.type === "Food Order" && item.isUserProvider && (item as any).orderStatus === "Preparing" && (
                <Button size="sm" className="h-8 text-xs bg-purple-500 text-white hover:bg-purple-600" onClick={() => onAction("update_food", item.id)}>Dispatch Delivery</Button>
            )}
            {item.type === "Food Order" && !item.isUserProvider && (item as any).orderStatus === "Out for Delivery" && (
                <Button size="sm" className="h-8 text-xs bg-green-600 text-white hover:bg-green-700" onClick={() => onAction("confirm_delivery_food", item.id)}>Confirm Receipt</Button>
            )}

            {/* Cash Exchange Actions */}
            {item.type === "Cash Exchange" && item.isUserProvider && (item as any).appwriteStatus === "meeting_scheduled" && (
                <Button size="sm" className="h-8 text-xs bg-green-600 text-white hover:bg-green-700" onClick={() => onAction("complete_exchange", item.id)}>
                   <CheckCircle className="h-3 w-3 mr-1" /> Exchange Done
                </Button>
            )}

            {/* Market Seller Actions */}
            {item.type === "Transaction" && item.isUserProvider && (item as any).appwriteStatus === "commission_deducted" && (
                <Button size="sm" className="h-8 text-xs bg-green-600 text-white hover:bg-green-700" onClick={() => onAction("confirm_delivery_market", item.id)}>
                   <Package className="h-3 w-3 mr-1" /> Item Delivered
                </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// --- MAIN PAGE ---
const TrackingPage = () => {
  const { user, userProfile } = useAuth();
  const { orders: foodOrders, isLoading: isLoadingFood, refetch: refetchFoodOrders } = useFoodOrders();
  
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");

  // Fetch Market Data
  const fetchTransactions = useCallback(async () => {
    if (!user?.$id) return [];
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [
          Query.or([Query.equal('buyerId', user.$id), Query.equal('sellerId', user.$id)]),
          Query.orderDesc('$createdAt')
        ]
      );
      
      // Map Appwrite Docs to TrackingItems
      return response.documents.map((doc: any) => ({
        id: doc.$id,
        type: doc.type === 'cash-exchange' ? 'Cash Exchange' : doc.type === 'collaboration' ? 'Collaboration' : 'Transaction',
        description: doc.productTitle,
        productTitle: doc.productTitle,
        status: mapAppwriteStatusToTrackingStatus(doc.status),
        appwriteStatus: doc.status,
        date: new Date(doc.$createdAt).toLocaleDateString(),
        timestamp: new Date(doc.$createdAt).getTime(),
        amount: doc.amount,
        sellerName: doc.sellerName,
        buyerName: doc.buyerName,
        sellerId: doc.sellerId, // Fixed: Added missing prop
        buyerId: doc.buyerId,   // Fixed: Added missing prop
        netSellerAmount: doc.netSellerAmount, // Fixed: Added missing prop
        isUserProvider: doc.sellerId === user.$id,
        collegeName: doc.collegeName,
        ambassadorDelivery: doc.ambassadorDelivery,
        ambassadorMessage: doc.ambassadorMessage
      } as MarketTransactionItem));

    } catch (e) {
      console.error(e);
      return [];
    }
  }, [user?.$id]);

  // Refresh All Data
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    const transactions = await fetchTransactions();
    
    const foodItems = foodOrders.map(order => ({
      id: order.$id,
      type: "Food Order",
      description: order.offeringTitle,
      offeringTitle: order.offeringTitle,
      status: order.status,
      orderStatus: order.status,
      date: new Date(order.$createdAt).toLocaleDateString(),
      timestamp: new Date(order.$createdAt).getTime(),
      totalAmount: order.totalAmount,
      providerName: order.providerName,
      buyerName: order.buyerName,
      providerId: order.providerId, // Fixed
      buyerId: order.buyerId,       // Fixed
      isUserProvider: order.providerId === user?.$id,
      quantity: order.quantity,
      deliveryLocation: order.deliveryLocation,
      collegeName: order.collegeName,
      ambassadorDelivery: order.ambassadorDelivery,
      ambassadorMessage: order.ambassadorMessage
    } as FoodOrderItem));

    const combined = [...transactions, ...foodItems].sort((a, b) => b.timestamp - a.timestamp);
    setItems(combined);
    setIsLoading(false);
  }, [fetchTransactions, foodOrders, user?.$id]);

  useEffect(() => {
    if(user) refreshData();
  }, [user, refreshData]);

  // Handle Actions
  const handleAction = async (action: string, id: string) => {
    try {
        if(action === "confirm_food" || action === "update_food") {
            const order = foodOrders.find(o => o.$id === id);
            let nextStatus = "Confirmed";
            if(order?.status === "Confirmed") nextStatus = "Preparing";
            if(order?.status === "Preparing") nextStatus = "Out for Delivery";
            
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID, id, { status: nextStatus });
            toast.success("Order status updated!");
        } 
        else if (action === "confirm_delivery_food") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID, id, { status: "Delivered" });
            toast.success("Order marked delivered.");
        }
        else if (action === "complete_exchange") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { status: "completed" });
            toast.success("Cash Exchange Closed.");
        }
        else if (action === "confirm_delivery_market") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { status: "seller_confirmed_delivery" });
            toast.success("Delivery Confirmed!");
        }
        refreshData();
    } catch (e) {
        toast.error("Action failed.");
    }
  };

  const activeItems = items.filter(i => i.status !== "Completed" && i.status !== "Delivered" && i.status !== "Cancelled");
  const historyItems = items.filter(i => i.status === "Completed" || i.status === "Delivered" || i.status === "Cancelled");

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-black italic tracking-tight text-foreground">
                    ACTIVITY<span className="text-secondary-neon">LOG</span>
                </h1>
                <p className="text-xs text-muted-foreground font-medium">Track orders, deliveries, and gigs.</p>
            </div>
            <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 p-1">
                <TabsTrigger value="active" className="text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-secondary-neon data-[state=active]:shadow-sm">
                    <Activity className="h-4 w-4 mr-2" /> Live ({activeItems.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                    <History className="h-4 w-4 mr-2" /> History
                </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                {activeItems.length > 0 ? (
                    activeItems.map(item => <TrackingCard key={item.id} item={item} onAction={handleAction} />)
                ) : (
                    <div className="text-center py-12 border border-dashed border-border rounded-xl">
                        <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-muted-foreground">No active activities.</p>
                    </div>
                )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                {historyItems.length > 0 ? (
                    historyItems.map(item => <TrackingCard key={item.id} item={item} onAction={handleAction} />)
                ) : (
                    <div className="text-center py-12 border border-dashed border-border rounded-xl">
                        <History className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                        <p className="text-muted-foreground">History is empty.</p>
                    </div>
                )}
            </TabsContent>
        </Tabs>

      </div>
      <MadeWithDyad />
    </div>
  );
};

export default TrackingPage;