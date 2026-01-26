"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom"; 
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  IndianRupee, Loader2, Utensils, CheckCircle, 
  Handshake, Clock, ShoppingBag, Activity, Camera, 
  ShieldCheck, XCircle, PackageCheck,
  MessageCircle, Briefcase, Wallet, Ban, Hourglass,
  Save, Zap, ArrowRight, UserCircle, Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  databases, 
  APPWRITE_DATABASE_ID, 
  APPWRITE_TRANSACTIONS_COLLECTION_ID, 
  APPWRITE_FOOD_ORDERS_COLLECTION_ID, 
  APPWRITE_PRODUCTS_COLLECTION_ID, 
  APPWRITE_CHAT_ROOMS_COLLECTION_ID 
} from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Query, ID } from "appwrite";
import { useFoodOrders, FoodOrder } from "@/hooks/useFoodOrders";

// --- HELPERS ---
const mapAppwriteStatusToTrackingStatus = (status: string): string => {
  const map: Record<string, string> = {
    "negotiating": "Negotiating",
    "initiated": "Payment Pending",
    "payment_confirmed_to_developer": "Verifying Payment",
    "commission_deducted": "Ready to Start",
    "active": "In Progress",
    "seller_confirmed_delivery": "Delivered / Reviewing",
    "completed": "Completed",
    "failed": "Cancelled",
    "disputed": "Disputed"
  };
  return map[status] || status;
};

// --- INTERFACES ---
export interface BaseTrackingItem {
  id: string;
  description: string;
  date: string;
  status: string;
  isUserProvider: boolean;
  timestamp: number;
}

export interface MarketTransactionItem extends BaseTrackingItem {
  type: "Transaction" | "Cash Exchange" | "Service" | "Rental" | "Errand" | "Collaboration";
  productId?: string;
  productTitle: string;
  amount: number;
  sellerName: string;
  buyerName: string;
  sellerId: string;
  buyerId: string;
  appwriteStatus: string;
}

export interface FoodOrderItem extends BaseTrackingItem {
    type: "Food Order";
    offeringTitle: string;
    totalAmount: number;
    providerName: string;
    buyerName: string;
    providerId: string;
    buyerId: string;
    orderStatus: FoodOrder["status"];
}

type TrackingItem = MarketTransactionItem | FoodOrderItem;

// --- COMPONENT: PROGRESS STEPPER ---
const StatusStepper = ({ currentStep }: { currentStep: number }) => {
    const steps = ["Order", "Pay", "Work", "Ship", "Done"];
    return (
        <div className="flex items-center justify-between w-full px-2 my-6 relative">
            <div className="absolute left-0 top-3 w-full h-[1px] bg-muted -z-10" />
            <div 
                className="absolute left-0 top-3 h-[2px] bg-secondary-neon transition-all duration-700 shadow-[0_0_8px_rgba(0,243,255,0.5)] -z-10" 
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }} 
            />
            {steps.map((label, index) => (
                <div key={label} className="flex flex-col items-center gap-2">
                    <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-500 bg-background text-[10px] font-black",
                        index <= currentStep ? "border-secondary-neon text-secondary-neon shadow-[0_0_10px_rgba(0,243,255,0.2)]" : "border-muted text-muted-foreground"
                    )}>
                        {index < currentStep ? <CheckCircle className="h-3 w-3" /> : index + 1}
                    </div>
                    <span className={cn(
                        "text-[8px] font-black uppercase tracking-tighter transition-colors", 
                        index <= currentStep ? "text-foreground" : "text-muted-foreground"
                    )}>{label}</span>
                </div>
            ))}
        </div>
    );
};

// --- COMPONENT: TRACKING CARD ---
const TrackingCard = ({ item, onAction, onChat }: { item: TrackingItem, onAction: (action: string, id: string, payload?: any) => void, currentUser: any, onChat: (item: TrackingItem) => void }) => {
  const [newAmount, setNewAmount] = useState<string>(item.type === 'Errand' ? (item as MarketTransactionItem).amount.toString() : "0");
  const navigate = useNavigate();

  const isMarket = item.type !== "Food Order";
  const marketItem = isMarket ? (item as MarketTransactionItem) : null;
  const foodItem = !isMarket ? (item as FoodOrderItem) : null;

  let currentStep = 0;
  if (marketItem) {
      if (marketItem.appwriteStatus === 'completed') currentStep = 4;
      else if (marketItem.appwriteStatus === 'seller_confirmed_delivery') currentStep = 3;
      else if (marketItem.appwriteStatus === 'active') currentStep = 2;
      else if (['commission_deducted', 'payment_confirmed_to_developer'].includes(marketItem.appwriteStatus)) currentStep = 1;
  } else if (foodItem) {
      if (['Delivered', 'completed'].includes(foodItem.orderStatus)) currentStep = 4;
      else if (foodItem.orderStatus === 'Out for Delivery') currentStep = 3;
      else if (foodItem.orderStatus === 'Preparing') currentStep = 2;
      else if (foodItem.orderStatus === 'Confirmed') currentStep = 1;
  }

  const isCompleted = currentStep === 4 || item.status === 'Cancelled' || item.status === 'Disputed';

  const initiatePayment = () => {
      if(!marketItem) return;
      const queryParams = new URLSearchParams({ 
        amount: marketItem.amount.toString(), 
        txnId: marketItem.id, 
        title: marketItem.productTitle 
      }).toString();
      navigate(`/escrow-payment?${queryParams}`);
  };

  const partnerName = item.isUserProvider ? (item as any).buyerName : (item.type === 'Food Order' ? (item as any).providerName : (item as any).sellerName);

  return (
    <Card className={cn(
      "relative overflow-hidden border-2 transition-all bg-card shadow-sm mb-4 group hover:shadow-neon/10 animate-in fade-in zoom-in-95 duration-300 rounded-2xl", 
      item.isUserProvider ? "border-secondary-neon/20" : "border-blue-500/20"
    )}>
      {/* Role Indicator Ribbon */}
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full",
        item.isUserProvider ? "bg-secondary-neon shadow-[2px_0_10px_rgba(0,243,255,0.4)]" : "bg-blue-500 shadow-[2px_0_10px_rgba(59,130,246,0.4)]"
      )} />

      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-muted/30 rounded-2xl border border-border/50">
                {item.type === "Rental" ? <Clock className="h-5 w-5 text-purple-500" /> : 
                 item.type === "Food Order" ? <Utensils className="h-5 w-5 text-orange-500" /> :
                 <ShoppingBag className="h-5 w-5 text-blue-500" />}
            </div>
            <div>
              <h4 className="font-black text-base text-foreground leading-tight tracking-tight uppercase italic">
                {item.type === 'Food Order' ? foodItem?.offeringTitle : marketItem?.productTitle}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-[8px] font-black tracking-widest bg-muted/50 px-1.5 py-0">
                  {item.type}
                </Badge>
                <span className="text-[10px] text-muted-foreground font-mono">{item.date}</span>
              </div>
            </div>
          </div>
          <Badge className={cn(
            "text-[9px] font-black uppercase tracking-widest px-2 py-1 border-0 shadow-sm",
            isCompleted ? "bg-muted text-muted-foreground" : "bg-secondary-neon/10 text-secondary-neon animate-pulse"
          )}>
            {item.status}
          </Badge>
        </div>

        {!isCompleted && <StatusStepper currentStep={currentStep} />}

        {/* DYNAMIC ERRAND PRICE PANEL */}
        {!isCompleted && item.type === 'Errand' && marketItem && (
          <div className="mb-5 p-4 bg-secondary-neon/5 rounded-2xl border border-secondary-neon/10 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase text-secondary-neon tracking-widest flex items-center gap-1.5">
                  <Target className="h-3 w-3" /> Bounty Reward
                </Label>
                {item.isUserProvider && marketItem.appwriteStatus === 'initiated' && (
                   <span className="text-[8px] font-bold text-muted-foreground animate-pulse underline">NEGOTIATE NOW</span>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                   <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-neon" />
                   <Input 
                      type="number" 
                      value={newAmount} 
                      onChange={(e) => setNewAmount(e.target.value)} 
                      disabled={!item.isUserProvider || marketItem.appwriteStatus !== 'initiated'} 
                      className="h-12 pl-10 text-lg font-black bg-background border-2 border-border/50 rounded-xl focus:border-secondary-neon transition-all"
                      placeholder="0.00"
                   />
                </div>
                {item.isUserProvider && marketItem.appwriteStatus === 'initiated' && (
                  <Button 
                    size="icon" 
                    className="h-12 w-12 bg-secondary-neon text-primary-foreground rounded-xl shadow-neon active:scale-90 transition-all" 
                    onClick={() => onAction("update_errand_price", item.id, { amount: parseFloat(newAmount) })}
                  >
                    <Save className="h-5 w-5" />
                  </Button>
                )}
              </div>
              {!item.isUserProvider && marketItem.amount <= 0 && (
                 <div className="flex items-center gap-2 text-muted-foreground animate-bounce mt-2">
                    <Hourglass className="h-3 w-3" />
                    <span className="text-[10px] font-bold italic">Waiting for Poster to set the bounty...</span>
                 </div>
              )}
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-2 gap-3 mt-4">
            <Button 
              variant="outline" 
              className={cn(
                "h-11 gap-2 font-black text-xs uppercase transition-all rounded-xl border-2",
                isCompleted ? "opacity-50 grayscale" : "border-secondary-neon/20 text-secondary-neon hover:bg-secondary-neon/5"
              )} 
              onClick={() => onChat(item)} 
              disabled={isCompleted}
            >
                <MessageCircle className="h-4 w-4" /> Chat
            </Button>

            {!isCompleted && marketItem && !item.isUserProvider && ['negotiating', 'initiated'].includes(marketItem.appwriteStatus) ? (
                <Button 
                  className="h-11 bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase rounded-xl shadow-lg shadow-green-500/20 animate-in fade-in zoom-in-95" 
                  onClick={initiatePayment} 
                  disabled={marketItem.amount <= 0}
                >
                    {marketItem.amount > 0 ? (
                      <span className="flex items-center gap-2"><Wallet className="h-4 w-4" /> Pay ₹{marketItem.amount}</span>
                    ) : (
                      <span className="flex items-center gap-2 opacity-50"><Lock className="h-3 w-3" /> Locked</span>
                    )}
                </Button>
            ) : (
               <Button variant="ghost" disabled className="h-11 opacity-30 font-black text-[10px] uppercase border-2 border-dashed rounded-xl">
                  {isCompleted ? "Deal Archived" : "Task in Progress"}
               </Button>
            )}
        </div>

        {/* ROLE IDENTIFIER FOOTER */}
        <div className="mt-5 pt-3 border-t border-border/30 flex justify-between items-center">
            <div className="flex items-center gap-2 opacity-60">
               <UserCircle className="h-3 w-3" />
               <span className="text-[9px] font-black uppercase tracking-widest">
                  Role: {item.isUserProvider ? "Provider" : "Client"}
               </span>
            </div>
            <span className="text-[9px] font-mono text-muted-foreground opacity-40 uppercase">UID: {item.id.substring(item.id.length - 8)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// --- MAIN PAGE ---
const TrackingPage = () => {
  const { user } = useAuth();
  const { orders: initialFoodOrders } = useFoodOrders();
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const refreshData = useCallback(async () => {
    if (!user?.$id) return;
    setIsLoading(true);
    try {
      const response = await databases.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, [
        Query.or([Query.equal('buyerId', user.$id), Query.equal('sellerId', user.$id)]),
        Query.orderDesc('$createdAt')
      ]);
      
      const uniqueDealsMap = new Map<string, TrackingItem>();
      response.documents.forEach((doc: any) => {
        const item = processTransactionDoc(doc, user.$id);
        const dealKey = item.productId || item.id; 
        if (!uniqueDealsMap.has(dealKey)) uniqueDealsMap.set(dealKey, item);
      });

      initialFoodOrders.forEach(o => {
        const item = processFoodDoc(o, user.$id);
        const dealKey = `${item.offeringTitle}_${item.providerId}`;
        if (!uniqueDealsMap.has(dealKey)) uniqueDealsMap.set(dealKey, item);
      });

      setItems(Array.from(uniqueDealsMap.values()).sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) { toast.error("Sync failed."); } 
    finally { setIsLoading(false); }
  }, [user, initialFoodOrders]);

  useEffect(() => {
    if (!user?.$id) return;
    refreshData();
    const unsubscribe = databases.client.subscribe([`databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TRANSACTIONS_COLLECTION_ID}.documents`], (res) => {
        refreshData();
    });
    return () => unsubscribe();
  }, [user, refreshData]);

  const handleAction = async (action: string, id: string, payload?: any) => {
    try {
        if (action === "update_errand_price") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { amount: payload.amount });
            toast.success("Hustle updated! Reward amount synced.");
            refreshData();
        }
    } catch (e: any) { toast.error("Action failed"); }
  };

  const processTransactionDoc = (doc: any, currentUserId: string): MarketTransactionItem => {
    return {
        id: doc.$id,
        type: doc.type === 'rent' ? 'Rental' : doc.type === 'errand' ? 'Errand' : doc.type === 'service' ? 'Service' : 'Transaction',
        productId: doc.productId,
        productTitle: doc.productTitle || "Untitled Task",
        description: doc.productTitle,
        status: mapAppwriteStatusToTrackingStatus(doc.status),
        appwriteStatus: doc.status,
        date: new Date(doc.$createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        timestamp: new Date(doc.$createdAt).getTime(),
        amount: doc.amount || 0,
        sellerName: doc.sellerName,
        buyerName: doc.buyerName,
        sellerId: doc.sellerId,
        buyerId: doc.buyerId,
        isUserProvider: doc.sellerId === currentUserId,
    };
  };

  const processFoodDoc = (doc: any, currentUserId: string): FoodOrderItem => {
    return {
        id: doc.$id,
        type: "Food Order",
        offeringTitle: doc.offeringTitle,
        description: doc.offeringTitle,
        status: doc.status,
        orderStatus: doc.status,
        totalAmount: doc.totalAmount,
        providerName: doc.providerName,
        buyerName: doc.buyerName,
        providerId: doc.providerId,
        buyerId: doc.buyerId,
        isUserProvider: doc.providerId === currentUserId,
        timestamp: new Date(doc.$createdAt).getTime(),
        date: new Date(doc.$createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    };
  };

  const activeTasks = items.filter(i => !i.status.toLowerCase().includes('completed') && i.status !== 'Cancelled');
  const historyTasks = items.filter(i => i.status.toLowerCase().includes('completed') || i.status === 'Cancelled');

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-24 relative overflow-x-hidden">
      
      {/* HEADER */}
      <div className="max-w-md mx-auto mb-8 flex items-center justify-between">
        <div>
           <h1 className="text-4xl font-black italic tracking-tighter uppercase">Activity<span className="text-secondary-neon">Log</span></h1>
           <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] opacity-60">Real-time Task Pulse</p>
        </div>
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-secondary-neon" />}
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/20 p-1 rounded-2xl border border-border/50 h-12">
                <TabsTrigger value="all" className="text-[11px] font-black uppercase rounded-xl data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground transition-all">Active Deals ({activeTasks.length})</TabsTrigger>
                <TabsTrigger value="history" className="text-[11px] font-black uppercase rounded-xl data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground transition-all">Past Gigs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="pt-6 space-y-4">
                 {activeTasks.length === 0 ? (
                    <div className="text-center py-20 opacity-30 flex flex-col items-center">
                        <Activity className="h-12 w-12 mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">No Active Missions</p>
                    </div>
                 ) : (
                    activeTasks.map(item => (
                      <TrackingCard key={item.id} item={item} onAction={handleAction} currentUser={user} onChat={(i) => navigate(`/chat/${i.id}`)} />
                    ))
                 )}
            </TabsContent>

            <TabsContent value="history" className="pt-6 space-y-4">
                 {historyTasks.length === 0 ? (
                    <div className="text-center py-20 opacity-30 flex flex-col items-center">
                        <PackageCheck className="h-12 w-12 mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">History Empty</p>
                    </div>
                 ) : (
                    historyTasks.map(item => (
                      <TrackingCard key={item.id} item={item} onAction={handleAction} currentUser={user} onChat={(i) => navigate(`/chat/${i.id}`)} />
                    ))
                 )}
            </TabsContent>
        </Tabs>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default TrackingPage;