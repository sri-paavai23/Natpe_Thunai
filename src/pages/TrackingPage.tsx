"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom"; 
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  IndianRupee, Loader2, Utensils, CheckCircle, 
  Handshake, Clock, ShoppingBag, Activity, Camera, 
  ShieldCheck, XCircle, PackageCheck,
  MessageCircle, Briefcase, Wallet, Ban, Hourglass,
  Save, Edit3
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
const uploadToCloudinary = async (file: File): Promise<string> => {
  const CLOUD_NAME = "dpusuqjvo";
  const UPLOAD_PRESET = "natpe_thunai_preset";
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.secure_url; 
  } catch (error: any) {
    throw new Error("Upload failed");
  }
};

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
  handoverEvidenceUrl?: string;
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
    const steps = ["Ordered", "Paid", "In Progress", "Delivered", "Done"];
    return (
        <div className="flex items-center justify-between w-full px-1 my-4 relative">
            <div className="absolute left-0 top-2.5 w-full h-0.5 bg-muted -z-10" />
            <div className="absolute left-0 top-2.5 h-0.5 bg-secondary-neon transition-all duration-500 -z-10" style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }} />
            {steps.map((label, index) => (
                <div key={label} className="flex flex-col items-center gap-1.5">
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-background", index <= currentStep ? "border-secondary-neon text-secondary-neon" : "border-muted text-muted-foreground")}>
                        {index <= currentStep ? <div className="w-2.5 h-2.5 bg-secondary-neon rounded-full" /> : <div className="w-2 h-2 bg-muted rounded-full" />}
                    </div>
                    <span className={cn("text-[9px] font-medium", index <= currentStep ? "text-foreground font-bold" : "text-muted-foreground")}>{label}</span>
                </div>
            ))}
        </div>
    );
};

// --- COMPONENT: TRACKING CARD ---
const TrackingCard = ({ item, onAction, onChat }: { item: TrackingItem, onAction: (action: string, id: string, payload?: any) => void, currentUser: any, onChat: (item: TrackingItem) => void }) => {
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceMode, setEvidenceMode] = useState<"upload_handover" | "upload_return" | "view_handover">("view_handover");
  const [isUploading, setIsUploading] = useState(false);
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
      const queryParams = new URLSearchParams({ amount: marketItem.amount.toString(), txnId: marketItem.id, title: marketItem.productTitle }).toString();
      navigate(`/escrow-payment?${queryParams}`);
  };

  const partnerName = item.isUserProvider ? (item as any).buyerName : (item.type === 'Food Order' ? (item as any).providerName : (item as any).sellerName);

  return (
    <Card className={cn("border-l-4 transition-all bg-card shadow-sm mb-4 group hover:shadow-md animate-in fade-in zoom-in-95 duration-300", item.isUserProvider ? "border-l-secondary-neon" : "border-l-blue-500")}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-muted/50 rounded-xl border border-border/50">
                {item.type === "Rental" ? <Clock className="h-5 w-5 text-purple-500" /> : <ShoppingBag className="h-5 w-5 text-blue-500" />}
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground leading-tight">{item.type === 'Food Order' ? foodItem?.offeringTitle : marketItem?.productTitle}</h4>
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">{item.type.toUpperCase()} • {item.date}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[9px] font-bold uppercase bg-muted">{item.status}</Badge>
        </div>

        {!isCompleted && <StatusStepper currentStep={currentStep} />}

        {/* DYNAMIC PRICE FOR ERRANDS */}
        {!isCompleted && item.type === 'Errand' && marketItem && (
          <div className="mb-4 p-3 bg-secondary-neon/5 rounded-xl border border-secondary-neon/20 space-y-2">
              <Label className="text-[10px] font-black uppercase text-secondary-neon tracking-widest">Set Reward Amount</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                   <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                   <Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} disabled={!item.isUserProvider || marketItem.appwriteStatus !== 'initiated'} className="h-9 pl-8 text-sm font-bold bg-background" />
                </div>
                {item.isUserProvider && marketItem.appwriteStatus === 'initiated' && (
                  <Button size="sm" className="h-9 bg-secondary-neon text-primary-foreground" onClick={() => onAction("update_errand_price", item.id, { amount: parseFloat(newAmount) })}><Save className="h-4 w-4" /></Button>
                )}
              </div>
          </div>
        )}

        <div className="mb-3 w-full space-y-2">
            <Button size="sm" variant="outline" className="h-8 gap-2 w-full border-secondary-neon/50 text-secondary-neon" onClick={() => onChat(item)} disabled={isCompleted}>
                <MessageCircle className="h-4 w-4" /> {isCompleted ? "Closed" : `Chat with ${partnerName?.split(' ')[0]}`}
            </Button>

            {!isCompleted && marketItem && !item.isUserProvider && ['negotiating', 'initiated'].includes(marketItem.appwriteStatus) && (
                <Button size="sm" className="h-8 w-full bg-green-600 text-white font-semibold" onClick={initiatePayment} disabled={marketItem.amount <= 0}>
                    <Wallet className="h-3 w-3 mr-2" /> {marketItem.amount > 0 ? `Pay Escrow (₹${marketItem.amount})` : 'Waiting for Price'}
                </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

// --- MAIN PAGE ---
const TrackingPage = () => {
  const { user, userProfile } = useAuth();
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
        Query.orderAsc('$createdAt')
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
            toast.success("Reward updated!");
        }
        // ... Handle other actions (verify_payment, mark_delivered etc) ...
    } catch (e: any) { toast.error("Action failed"); }
  };

  const processTransactionDoc = (doc: any, currentUserId: string): MarketTransactionItem => {
    return {
        id: doc.$id,
        type: doc.type === 'rent' ? 'Rental' : doc.type === 'errand' ? 'Errand' : 'Transaction',
        productId: doc.productId,
        productTitle: doc.productTitle || "Untitled",
        description: doc.productTitle,
        status: mapAppwriteStatusToTrackingStatus(doc.status),
        appwriteStatus: doc.status,
        date: new Date(doc.$createdAt).toLocaleDateString(),
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
        date: new Date(doc.$createdAt).toLocaleDateString(),
    };
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-3xl font-black italic tracking-tight uppercase">Activity<span className="text-secondary-neon">Log</span></h1>
        <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-2 bg-muted/30">
                <TabsTrigger value="all" className="text-xs font-bold">Active</TabsTrigger>
                <TabsTrigger value="history" className="text-xs font-bold">History</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="pt-4">
                 {items.filter(i => !i.status.toLowerCase().includes('completed') && i.status !== 'Cancelled').map(item => (
                    <TrackingCard key={item.id} item={item} onAction={handleAction} currentUser={user} onChat={(i) => navigate(`/chat/${i.id}`)} />
                ))}
            </TabsContent>
        </Tabs>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default TrackingPage;