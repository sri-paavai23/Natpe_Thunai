"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom"; 
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  IndianRupee, Loader2, Utensils, CheckCircle, 
  Handshake, Clock, ShoppingBag, Activity, 
  PackageCheck, MessageCircle, Briefcase, Wallet, Ban, Hourglass,
  Save, ArrowRight, UserCircle, Target, Lock as LockIcon, CheckCircle2,
  Users
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { 
  databases, 
  APPWRITE_DATABASE_ID, 
  APPWRITE_TRANSACTIONS_COLLECTION_ID, 
  APPWRITE_CHAT_ROOMS_COLLECTION_ID,
  APPWRITE_USER_PROFILES_COLLECTION_ID 
} from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Query, ID } from "appwrite";
import { useFoodOrders, FoodOrder } from "@/hooks/useFoodOrders";

// --- ONESIGNAL CONFIGURATION (Direct REST API) ---
// ⚠️ REPLACE THESE WITH YOUR ACTUAL KEYS FROM ONESIGNAL DASHBOARD
const ONESIGNAL_APP_ID = "YOUR_ONESIGNAL_APP_ID"; 
const ONESIGNAL_REST_KEY = "YOUR_ONESIGNAL_REST_API_KEY";

// --- NOTIFICATION HELPER ---
const sendTransactionNotification = async (
    recipientPlayerId: string, 
    title: string, 
    message: string,
    data: any = {}
) => {
    if (!recipientPlayerId || !ONESIGNAL_APP_ID) return;

    try {
        await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${ONESIGNAL_REST_KEY}`
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                include_player_ids: [recipientPlayerId],
                headings: { en: title },
                contents: { en: message },
                data: data,
                android_group: "transactions", 
                ttl: 3600, 
                priority: 10
            })
        });
        console.log("🔔 Notification sent to", recipientPlayerId);
    } catch (e) {
        console.error("Notification failed", e);
    }
};

// --- INTERFACES ---
export interface BaseTrackingItem {
  id: string;
  description: string;
  date: string;
  status: string;
  isUserProvider: boolean; 
  timestamp: number;
  lastUpdated: number; 
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

// --- STEPPER COMPONENT ---
const StatusStepper = ({ currentStep, steps }: { currentStep: number, steps: string[] }) => {
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

// --- ACTION BUTTON LOGIC ---
const ActionButtons = ({ item, marketItem, onAction, initiatePayment, isCompleted }: any) => {
    // FIX: Use item.status fallback if marketItem is null (e.g., Food Orders)
    const status = marketItem?.appwriteStatus || item.status || 'initiated';
    const isProvider = item.isUserProvider; 
    const type = item.type;

    if (isCompleted) {
        return (
            <Button variant="ghost" disabled className="w-full h-11 opacity-50 border-2 border-dashed">
                <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" /> Deal Closed
            </Button>
        );
    }

    // STATE: INITIATED
    if (status === 'initiated' || status === 'negotiating') {
        if (!isProvider) {
            // FIX: Safely access amount to prevent crash if marketItem is null
            const displayAmount = marketItem?.amount || 0;
            
            return (
                <Button 
                    className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase rounded-xl shadow-lg animate-pulse" 
                    onClick={initiatePayment} 
                    disabled={displayAmount <= 0}
                >
                    {displayAmount > 0 ? (
                      <span className="flex items-center gap-2"><Wallet className="h-4 w-4" /> Pay Escrow ₹{displayAmount}</span>
                    ) : (
                      <span className="flex items-center gap-2 opacity-50"><LockIcon className="h-3 w-3" /> Chat to Fix Price</span>
                    )}
                </Button>
            );
        } else {
            return (
                <Button variant="secondary" disabled className="w-full h-11 opacity-70">
                    <Hourglass className="mr-2 h-4 w-4 animate-spin" /> Waiting for Client
                </Button>
            );
        }
    }

    // STATE: PAYMENT CONFIRMED
    if (status === 'payment_confirmed_to_developer' || status === 'commission_deducted') {
        if (isProvider) {
            let label = "Accept & Start";
            if (type === 'Food Order') label = "Confirm Order & Cook";
            if (type === 'Transaction') label = "Confirm & Pack Item";
            
            return (
                <Button className="w-full h-11 bg-secondary-neon text-primary-foreground font-black text-xs uppercase rounded-xl shadow-neon" onClick={() => onAction('start_work', item.id)}>
                    <Handshake className="mr-2 h-4 w-4" /> {label}
                </Button>
            );
        } else {
            return <Button variant="secondary" disabled className="w-full h-11">Waiting for Provider...</Button>;
        }
    }

    // STATE: ACTIVE
    if (status === 'active') {
        if (isProvider) {
            let label = "Mark Completed";
            if (type === 'Food Order') label = "Out for Delivery";
            if (type === 'Transaction') label = "Mark Shipped / Ready";
            
            return (
                <Button className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase rounded-xl" onClick={() => onAction('mark_delivered', item.id)}>
                    <PackageCheck className="mr-2 h-4 w-4" /> {label}
                </Button>
            );
        } else {
            return <Button variant="secondary" disabled className="w-full h-11">Work in Progress...</Button>;
        }
    }

    // STATE: DELIVERED
    if (status === 'seller_confirmed_delivery') {
        if (!isProvider) {
            let label = "Confirm Receipt";
            if (type === 'Food Order') label = "Food Received - Yummy!";
            if (type === 'Service') label = "Job Done - Release Pay";

            return (
                <Button className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-black text-xs uppercase rounded-xl shadow-lg" onClick={() => onAction('confirm_receipt', item.id)}>
                    <CheckCircle className="mr-2 h-4 w-4" /> {label}
                </Button>
            );
        } else {
            return <Button variant="secondary" disabled className="w-full h-11">Waiting for Client...</Button>;
        }
    }

    return null;
};

// --- COMPONENT: TRACKING CARD ---
const TrackingCard = ({ item, onAction, onChat }: { item: TrackingItem, onAction: (action: string, id: string, payload?: any) => void, currentUser: any, onChat: (item: TrackingItem) => void }) => {
  const [newAmount, setNewAmount] = useState<string>(item.type === 'Errand' ? (item as MarketTransactionItem).amount.toString() : "0");
  const navigate = useNavigate();

  const isMarket = item.type !== "Food Order";
  const marketItem = isMarket ? (item as MarketTransactionItem) : null;
  const foodItem = !isMarket ? (item as FoodOrderItem) : null;

  // VISUAL FIX: Determine the "Counterparty" Name
  const counterpartyName = item.isUserProvider 
      ? (isMarket ? marketItem?.buyerName : foodItem?.buyerName) 
      : (isMarket ? marketItem?.sellerName : foodItem?.providerName);

  // FIX: Use item.status fallback for non-market items (Food Orders)
  const status = marketItem?.appwriteStatus || item.status || 'initiated';
  
  let currentStep = 0;
  if (status === 'completed') currentStep = 4;
  else if (status === 'seller_confirmed_delivery') currentStep = 3;
  else if (status === 'active') currentStep = 2;
  else if (status === 'payment_confirmed_to_developer' || status === 'commission_deducted') currentStep = 1;
  else currentStep = 0;

  const isCompleted = ['completed', 'failed', 'cancelled', 'disputed'].includes(status.toLowerCase());

  const initiatePayment = () => {
      if(!marketItem) return;
      const queryParams = new URLSearchParams({ 
        amount: marketItem.amount.toString(), 
        txnId: marketItem.id, 
        title: marketItem.productTitle 
      }).toString();
      navigate(`/escrow-payment?${queryParams}`);
  };

  const getStepsLabels = () => {
      if (item.type === 'Food Order') return ["Ordered", "Paid", "Cooking", "Delivery", "Enjoyed"];
      if (item.type === 'Service' || item.type === 'Errand') return ["Hired", "Escrow", "Working", "Review", "Done"];
      return ["Deal", "Paid", "Processing", "Shipped", "Received"];
  };

  return (
    <Card className={cn(
      "relative overflow-hidden border-2 transition-all bg-card shadow-sm mb-4 group hover:shadow-neon/10 animate-in fade-in zoom-in-95 duration-300 rounded-2xl", 
      item.isUserProvider ? "border-secondary-neon/20" : "border-blue-500/20"
    )}>
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full",
        item.isUserProvider ? "bg-secondary-neon" : "bg-blue-500"
      )} />

      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-muted/30 rounded-2xl border border-border/50">
                {item.type === "Rental" ? <Clock className="h-5 w-5 text-purple-500" /> : 
                 item.type === "Food Order" ? <Utensils className="h-5 w-5 text-orange-500" /> :
                 item.type === "Service" ? <Briefcase className="h-5 w-5 text-indigo-500" /> :
                 <ShoppingBag className="h-5 w-5 text-blue-500" />}
            </div>
            <div>
              <h4 className="font-black text-base text-foreground leading-tight tracking-tight uppercase italic line-clamp-1">
                {item.type === 'Food Order' ? foodItem?.offeringTitle : marketItem?.productTitle}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-[8px] font-black tracking-widest bg-muted/50 px-1.5 py-0">
                  {item.type}
                </Badge>
                {/* */}
                {/* VISUAL FIX: Show WHO the deal is with clearly */}
                <div className="flex items-center gap-1 text-[10px] text-foreground font-bold bg-muted/30 px-2 py-0.5 rounded-md">
                    <Users className="h-3 w-3" /> 
                    {item.isUserProvider ? "Client: " : "Provider: "}
                    <span className="text-primary">{counterpartyName || "Unknown"}</span>
                </div>
              </div>
            </div>
          </div>
          <Badge className={cn(
            "text-[9px] font-black uppercase tracking-widest px-2 py-1 border-0 shadow-sm",
            isCompleted ? "bg-muted text-muted-foreground" : "bg-secondary-neon/10 text-secondary-neon animate-pulse"
          )}>
            {status.replace(/_/g, ' ')}
          </Badge>
        </div>

        {!isCompleted && <StatusStepper currentStep={currentStep} steps={getStepsLabels()} />}

        {!isCompleted && item.type === 'Errand' && marketItem && (
          <div className="mb-5 p-4 bg-secondary-neon/5 rounded-2xl border border-secondary-neon/10 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase text-secondary-neon tracking-widest flex items-center gap-1.5">
                  <Target className="h-3 w-3" /> Bounty Reward
                </Label>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                   <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-neon" />
                   <Input 
                     type="number" 
                     value={newAmount} 
                     onChange={(e) => setNewAmount(e.target.value)} 
                     disabled={!item.isUserProvider || status !== 'initiated'} 
                     className="h-12 pl-10 text-lg font-black bg-background border-2 border-border/50 rounded-xl focus:border-secondary-neon transition-all"
                     placeholder="0.00"
                   />
                </div>
                {item.isUserProvider && status === 'initiated' && (
                  <Button 
                    size="icon" 
                    className="h-12 w-12 bg-secondary-neon text-primary-foreground rounded-xl shadow-neon" 
                    onClick={() => onAction("update_errand_price", item.id, { amount: parseFloat(newAmount) })}
                  >
                    <Save className="h-5 w-5" />
                  </Button>
                )}
              </div>
          </div>
        )}

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
                <MessageCircle className="h-4 w-4" /> {isCompleted ? "Chat Closed" : "Chat"}
            </Button>

            <ActionButtons 
                item={item} 
                marketItem={marketItem} 
                onAction={onAction} 
                initiatePayment={initiatePayment} 
                isCompleted={isCompleted} 
            />
        </div>

        <div className="mt-5 pt-3 border-t border-border/30 flex justify-between items-center">
            <div className="flex items-center gap-2 opacity-60">
               <UserCircle className="h-3 w-3" />
               <span className="text-[9px] font-black uppercase tracking-widest">
                  {item.isUserProvider ? "You are Provider" : "You are Client"}
               </span>
            </div>
            <span className="text-[9px] font-mono text-muted-foreground opacity-40 uppercase">TX: {item.id.substring(item.id.length - 6)}</span>
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
        Query.orderDesc('$createdAt'),
        Query.limit(100) 
      ]);
      
      const uniqueDealsMap = new Map<string, TrackingItem>();
      
      response.documents.forEach((doc: any) => {
        const item = processTransactionDoc(doc, user.$id);
        const dealKey = item.id; 
        if (!uniqueDealsMap.has(dealKey)) uniqueDealsMap.set(dealKey, item);
      });

      initialFoodOrders.forEach(o => {
        const item = processFoodDoc(o, user.$id);
        const dealKey = item.id;
        if (!uniqueDealsMap.has(dealKey)) uniqueDealsMap.set(dealKey, item);
      });

      setItems(Array.from(uniqueDealsMap.values()).sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) { toast.error("Sync failed."); } 
    finally { setIsLoading(false); }
  }, [user, initialFoodOrders]);

  useEffect(() => {
    if (!user?.$id) return;
    refreshData();
    const unsubscribe = databases.client.subscribe([`databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TRANSACTIONS_COLLECTION_ID}.documents`], () => {
        refreshData();
    });
    return () => unsubscribe();
  }, [user, refreshData]);

  const handleChatNavigation = async (item: TrackingItem) => {
    if (!user) return;
    try {
        const rooms = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_CHAT_ROOMS_COLLECTION_ID,
            [Query.equal('transactionId', item.id)]
        );

        if (rooms.documents.length > 0) {
            navigate(`/chat/${rooms.documents[0].$id}`);
        } else {
            const isMarket = item.type !== "Food Order";
            const marketItem = isMarket ? (item as MarketTransactionItem) : null;
            const foodItem = !isMarket ? (item as FoodOrderItem) : null;

            const buyerId = isMarket ? (marketItem?.buyerId || user.$id) : (foodItem?.buyerId || user.$id);
            const providerId = isMarket ? (marketItem?.sellerId || user.$id) : (foodItem?.providerId || user.$id);
            
            const buyerName = isMarket ? (marketItem?.buyerName || "Student") : (foodItem?.buyerName || "Student");
            const providerName = isMarket ? (marketItem?.sellerName || "Provider") : (foodItem?.providerName || "Provider");

            const newRoom = await databases.createDocument(
                APPWRITE_DATABASE_ID,
                APPWRITE_CHAT_ROOMS_COLLECTION_ID,
                ID.unique(),
                {
                    transactionId: item.id,
                    buyerId, 
                    providerId, 
                    buyerUsername: buyerName, 
                    providerUsername: providerName,
                    status: "active",
                    collegeName: userProfile?.collegeName || "Campus Peer"
                }
            );
            navigate(`/chat/${newRoom.$id}`);
        }
    } catch (e) { 
        console.error("Chat Error:", e);
        toast.error("Chat sync failed."); 
    }
  };

  // --- HELPER: FIND COUNTERPARTY ONE SIGNAL ID ---
  const getCounterpartyPlayerId = async (targetUserId: string) => {
    try {
        // If 'APPWRITE_PROFILES_COLLECTION_ID' is defined in your config, use it.
        // If not, ensure this logic matches your database structure for fetching user prefs.
        if (APPWRITE_PROFILES_COLLECTION_ID) {
            const profiles = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                APPWRITE_PROFILES_COLLECTION_ID,
                [Query.equal('userId', targetUserId)]
            );
            if (profiles.documents.length > 0) {
                return profiles.documents[0].oneSignalPlayerId;
            }
        }
    } catch (e) {
        console.log("Could not fetch counterparty player ID", e);
    }
    return null;
  };

  const handleAction = async (action: string, id: string, payload?: any) => {
    try {
        // 1. Identify current item context for notification logic
        const currentItem = items.find(i => i.id === id);
        let notificationMsg = "";
        let notificationTitle = "";
        let targetUserId = "";

        if (currentItem) {
            // Determine Target (The Counterparty)
            const isMarket = currentItem.type !== "Food Order";
            const marketItem = isMarket ? (currentItem as MarketTransactionItem) : null;
            const foodItem = !isMarket ? (currentItem as FoodOrderItem) : null;

            if (currentItem.isUserProvider) {
                targetUserId = isMarket ? marketItem?.buyerId || "" : foodItem?.buyerId || "";
            } else {
                targetUserId = isMarket ? marketItem?.sellerId || "" : foodItem?.providerId || "";
            }
        }

        // 2. Perform Database Update
        if (action === "update_errand_price") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { amount: payload.amount });
            toast.success("Bounty updated!");
            notificationTitle = "Bounty Update";
            notificationMsg = `The errand bounty has been updated to ₹${payload.amount}.`;
        } 
        else if (action === "start_work") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { status: "active" });
            toast.success("Work Started!");
            notificationTitle = "Action Started";
            notificationMsg = "The provider has started working on your request.";
        } 
        else if (action === "mark_delivered") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { status: "seller_confirmed_delivery" });
            toast.success("Marked Delivered/Done!");
            notificationTitle = "Task Completed";
            notificationMsg = "Provider marked the task as completed. Please confirm receipt.";
        } 
        else if (action === "confirm_receipt") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { status: "completed" });
            
            const rooms = await databases.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_CHAT_ROOMS_COLLECTION_ID, [Query.equal('transactionId', id)]);
            if(rooms.documents.length > 0) {
                await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_CHAT_ROOMS_COLLECTION_ID, rooms.documents[0].$id, { status: 'closed' });
            }
            
            toast.success("Deal Closed! Chat Locked.");
            notificationTitle = "Payment Released";
            notificationMsg = "Client confirmed receipt. Funds have been released to your wallet.";
        }

        // 3. Send Notification (Fire & Forget)
        if (targetUserId && notificationMsg) {
            getCounterpartyPlayerId(targetUserId).then(playerId => {
                if (playerId) {
                    sendTransactionNotification(playerId, notificationTitle, notificationMsg, { transactionId: id });
                }
            });
        }

        refreshData();
    } catch (e: any) { toast.error("Action failed"); }
  };

  const processTransactionDoc = (doc: any, currentUserId: string): MarketTransactionItem => {
    return {
        id: doc.$id,
        type: doc.type === 'rent' ? 'Rental' : doc.type === 'errand' ? 'Errand' : doc.type === 'service' ? 'Service' : 'Transaction',
        productId: doc.productId,
        productTitle: doc.productTitle || "Untitled Deal",
        description: doc.productTitle,
        status: doc.status,
        appwriteStatus: doc.status,
        date: new Date(doc.$createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        timestamp: new Date(doc.$createdAt).getTime(),
        lastUpdated: new Date(doc.$updatedAt).getTime(),
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
        lastUpdated: new Date(doc.$updatedAt).getTime(),
        date: new Date(doc.$createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    };
  };

  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  const activeTasks = items.filter(i => {
      const s = i.status.toLowerCase();
      return !s.includes('completed') && s !== 'cancelled' && s !== 'failed' && s !== 'disputed';
  });

  const historyTasks = items.filter(i => {
      const s = i.status.toLowerCase();
      const isFinished = s.includes('completed') || s === 'cancelled' || s === 'failed' || s === 'disputed';
      
      if (isFinished) {
          const timeSinceCompletion = now - i.lastUpdated;
          return timeSinceCompletion < ONE_DAY_MS;
      }
      return false;
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-24 relative overflow-x-hidden font-sans">
      <div className="max-w-md mx-auto mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase">Activity<span className="text-secondary-neon">Log</span></h1>
        {isLoading && <Loader2 className="h-5 w-5 animate-spin text-secondary-neon" />}
      </div>

      <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/20 p-1 rounded-2xl border border-border/50 h-12">
              <TabsTrigger value="all" className="text-[11px] font-black uppercase rounded-xl data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Active Missions</TabsTrigger>
              <TabsTrigger value="history" className="text-[11px] font-black uppercase rounded-xl data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Legacy Gigs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="pt-6 space-y-4">
               {activeTasks.length === 0 ? (
                  <div className="text-center py-20 opacity-30 flex flex-col items-center">
                      <Activity className="h-12 w-12 mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest">No Active Missions</p>
                  </div>
               ) : (
                  activeTasks.map(item => (
                    <TrackingCard key={item.id} item={item} onAction={handleAction} currentUser={user} onChat={handleChatNavigation} />
                  ))
               )}
          </TabsContent>

          <TabsContent value="history" className="pt-6 space-y-4">
               {historyTasks.length === 0 ? (
                  <div className="text-center py-20 opacity-30 flex flex-col items-center">
                      <PackageCheck className="h-12 w-12 mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest">History Empty</p>
                      <p className="text-[9px] text-muted-foreground mt-2">Completed deals vanish after 24 hours.</p>
                  </div>
               ) : (
                  historyTasks.map(item => (
                    <TrackingCard key={item.id} item={item} onAction={handleAction} currentUser={user} onChat={handleChatNavigation} />
                  ))
               )}
          </TabsContent>
      </Tabs>
      <MadeWithDyad />
    </div>
  );
};

export default TrackingPage;