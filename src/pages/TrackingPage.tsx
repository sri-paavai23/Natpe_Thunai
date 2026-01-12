"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { 
  Truck, DollarSign, Loader2, Utensils, CheckCircle, 
  Handshake, Clock, ShoppingBag, Activity, Camera, 
  AlertTriangle, Eye, ShieldCheck, XCircle, MessageCircle, Send, Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { databases, storage, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_PRODUCTS_COLLECTION_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID, APPWRITE_COLLEGE_ID_BUCKET_ID } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Query, ID, Models } from "appwrite";
import { useFoodOrders, FoodOrder } from "@/hooks/useFoodOrders";
import { DEVELOPER_UPI_ID } from "@/lib/config"; // Ensure this exists

// --- CONSTANTS ---
// Replace with your actual Collection ID for chat messages
const APPWRITE_CHAT_MESSAGES_COLLECTION_ID = "chat_messages"; 

// --- INTERFACES ---
export interface MarketTransactionItem {
  id: string;
  type: "Transaction" | "Cash Exchange" | "Service" | "Rental" | "Errand" | "Collaboration";
  productId?: string;
  productTitle: string;
  amount: number;
  sellerName: string;
  buyerName: string;
  sellerId: string;
  buyerId: string;
  status: string;
  appwriteStatus: string;
  date: string;
  timestamp: number;
  isUserProvider: boolean;
  
  // Handshake & Chat Props
  handoverEvidenceUrl?: string;
  returnEvidenceUrl?: string;
  isDisputed?: boolean;
  ambassadorDelivery?: boolean;
}

export interface FoodOrderItem {
    id: string;
    type: "Food Order";
    offeringTitle: string;
    totalAmount: number;
    providerName: string;
    buyerName: string;
    quantity: number;
    orderStatus: FoodOrder["status"];
    date: string;
    timestamp: number;
    isUserProvider: boolean;
    providerId: string;
    buyerId: string;
}

type TrackingItem = MarketTransactionItem | FoodOrderItem;

interface ChatMessage {
    $id: string;
    senderId: string;
    senderName: string;
    text: string;
    $createdAt: string;
}

// --- UTILS ---
const mapAppwriteStatusToTrackingStatus = (status: string): string => {
  const map: Record<string, string> = {
    "negotiating": "Negotiating",
    "initiated": "Payment Pending",
    "payment_confirmed_to_developer": "Processing",
    "commission_deducted": "Active / In Progress",
    "active": "Active",
    "seller_confirmed_delivery": "Work Delivered",
    "meeting_scheduled": "Meeting Set",
    "completed": "Completed",
    "failed": "Cancelled",
    "disputed": "Disputed"
  };
  return map[status] || status;
};

// --- COMPONENT: CHAT SHEET (The Interaction Hub) ---
const ChatSheet = ({ 
    item, 
    currentUser 
}: { 
    item: MarketTransactionItem, 
    currentUser: any 
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loadingChat, setLoadingChat] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Fetch Messages
    const fetchMessages = useCallback(async () => {
        try {
            const res = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                APPWRITE_CHAT_MESSAGES_COLLECTION_ID,
                [
                    Query.equal("transactionId", item.id),
                    Query.orderAsc("$createdAt")
                ]
            );
            setMessages(res.documents as unknown as ChatMessage[]);
        } catch (e) {
            console.error("Chat load error", e);
        } finally {
            setLoadingChat(false);
        }
    }, [item.id]);

    // Send Message
    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;
        try {
            await databases.createDocument(
                APPWRITE_DATABASE_ID,
                APPWRITE_CHAT_MESSAGES_COLLECTION_ID,
                ID.unique(),
                {
                    transactionId: item.id,
                    senderId: currentUser.$id,
                    senderName: currentUser.name,
                    text: newMessage,
                    timestamp: new Date().toISOString()
                }
            );
            setNewMessage("");
            fetchMessages(); // Optimistic update ideally, but fetch for now
        } catch (e) {
            toast.error("Failed to send message");
        }
    };

    // Realtime Subscription
    useEffect(() => {
        fetchMessages();
        const unsubscribe = databases.client.subscribe(
            `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_CHAT_MESSAGES_COLLECTION_ID}.documents`,
            (response) => {
                if (response.events.includes("databases.*.collections.*.documents.*.create")) {
                    const payload = response.payload as any;
                    if (payload.transactionId === item.id) {
                        setMessages(prev => [...prev, payload]);
                    }
                }
            }
        );
        return () => unsubscribe();
    }, [fetchMessages, item.id]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-2 border-secondary-neon/50 text-secondary-neon hover:bg-secondary-neon/10">
                    <MessageCircle className="h-4 w-4" /> Chat & Discuss
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[100%] sm:w-[400px] flex flex-col h-full p-0">
                <SheetHeader className="p-4 border-b border-border bg-muted/20">
                    <SheetTitle className="flex items-center gap-2 text-base">
                        {item.type === 'Service' ? <BriefcaseIcon /> : <ShoppingBag className="h-4 w-4" />}
                        {item.productTitle}
                    </SheetTitle>
                    <p className="text-xs text-muted-foreground">
                        Talking with {item.isUserProvider ? item.buyerName : item.sellerName}
                    </p>
                </SheetHeader>

                {/* Messages Area */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
                    {loadingChat ? (
                        <div className="flex justify-center py-4"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-muted-foreground text-sm py-10 opacity-50">
                            Start the conversation...<br/>Discuss requirements or negotiate price.
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.senderId === currentUser.$id;
                            return (
                                <div key={msg.$id} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                                    <div className={cn("px-3 py-2 rounded-lg text-sm", isMe ? "bg-secondary-neon text-primary-foreground rounded-br-none" : "bg-muted text-foreground rounded-bl-none")}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[9px] text-muted-foreground mt-1 px-1">
                                        {new Date(msg.$createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-border bg-card">
                    <form 
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                        className="flex gap-2"
                    >
                        <Input 
                            value={newMessage} 
                            onChange={(e) => setNewMessage(e.target.value)} 
                            placeholder="Type a message..." 
                            className="flex-1"
                        />
                        <Button type="submit" size="icon" className="bg-secondary-neon text-primary-foreground">
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </SheetContent>
        </Sheet>
    );
};

// --- COMPONENT: TRACKING CARD ---
const TrackingCard = ({ item, onAction, currentUser }: { item: TrackingItem, onAction: (action: string, id: string, payload?: any) => void, currentUser: any }) => {
  
  const isMarket = item.type !== "Food Order";
  const marketItem = isMarket ? (item as MarketTransactionItem) : null;
  
  // Icon Helper
  const getIcon = () => {
    switch (item.type) {
      case "Rental": return <Clock className="h-5 w-5 text-purple-500" />;
      case "Service": 
      case "Errand": return <Handshake className="h-5 w-5 text-indigo-500" />;
      case "Transaction": return <ShoppingBag className="h-5 w-5 text-blue-500" />;
      case "Food Order": return <Utensils className="h-5 w-5 text-orange-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  // Payment Link Generator
  const handlePayment = () => {
      if(!marketItem) return;
      // Note: In a real app, integrate a Gateway. Here we use UPI Intent for P2P.
      // Payment goes to DEVELOPER first (Escrow), then released to Seller later.
      const note = `Payment for ${marketItem.type}: ${marketItem.productTitle}`;
      const upiLink = `upi://pay?pa=${DEVELOPER_UPI_ID}&pn=NatpeThunaiEscrow&am=${marketItem.amount}&tn=${encodeURIComponent(note)}`;
      window.open(upiLink, '_blank');
      
      // Simulate "Payment Initiated" for UX (In real app, wait for webhook)
      onAction("mark_paid_by_buyer", item.id);
  };

  return (
    <Card className={cn("border-l-4 transition-all bg-card shadow-sm mb-4", 
      item.isUserProvider ? "border-l-secondary-neon" : "border-l-blue-500",
      marketItem?.isDisputed && "border-l-destructive"
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-muted/50 rounded-xl border border-border/50">{getIcon()}</div>
            <div>
              <h4 className="font-bold text-sm text-foreground leading-tight">
                {item.type === 'Food Order' ? (item as FoodOrderItem).offeringTitle : (item as MarketTransactionItem).productTitle}
              </h4>
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">{item.type.toUpperCase()} • {item.date}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-wider py-1", marketItem?.isDisputed ? "bg-red-500 text-white border-none" : "bg-muted")}>
            {item.status}
          </Badge>
        </div>

        {/* --- MARKET / SERVICE / ERRAND LOGIC --- */}
        {marketItem && (
          <div className="bg-muted/20 p-3 rounded-lg border border-border/50 mb-3 space-y-3">
            
            <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Amount: <b className="text-foreground">₹{marketItem.amount}</b></span>
                {marketItem.appwriteStatus === 'negotiating' && <span className="text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded text-[10px]">Price Negotiable</span>}
            </div>

            {/* ACTION AREA */}
            <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                
                {/* 1. Chat Button (Always visible for active/negotiating) */}
                {marketItem.appwriteStatus !== 'completed' && marketItem.appwriteStatus !== 'cancelled' && (
                    <ChatSheet item={marketItem} currentUser={currentUser} />
                )}

                {/* 2. Payment Button (Buyer Side - Only when Negotiating or Initiated) */}
                {!item.isUserProvider && (marketItem.appwriteStatus === 'negotiating' || marketItem.appwriteStatus === 'initiated') && (
                    <Button className="h-8 flex-1 bg-green-600 hover:bg-green-700 text-white gap-2" onClick={handlePayment}>
                        <Wallet className="h-4 w-4" /> Pay Now
                    </Button>
                )}

                {/* 3. Provider Actions */}
                {item.isUserProvider && (
                    <>
                        {/* Start Work (After payment) */}
                        {marketItem.appwriteStatus === 'payment_confirmed_to_developer' && (
                            <Button className="h-8 flex-1 bg-blue-600 text-white" onClick={() => onAction("start_work", item.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" /> Start Work
                            </Button>
                        )}
                        {/* Deliver Work */}
                        {marketItem.appwriteStatus === 'active' && (
                            <Button className="h-8 flex-1 bg-purple-600 text-white" onClick={() => onAction("deliver_work", item.id)}>
                                <PackageCheck className="h-4 w-4 mr-2" /> Mark Done
                            </Button>
                        )}
                    </>
                )}

                {/* 4. Buyer Confirm Receipt */}
                {!item.isUserProvider && marketItem.appwriteStatus === 'seller_confirmed_delivery' && (
                    <Button className="h-8 flex-1 bg-green-600 text-white" onClick={() => onAction("complete_transaction", item.id)}>
                        <CheckCircle className="h-4 w-4 mr-2" /> Confirm & Release Funds
                    </Button>
                )}
            </div>

            {/* Status Hint Text */}
            <div className="text-[10px] text-center text-muted-foreground italic">
                {marketItem.appwriteStatus === 'negotiating' && "Chat to finalize details. Pay to start."}
                {marketItem.appwriteStatus === 'payment_confirmed_to_developer' && "Payment held in escrow. Provider can start."}
                {marketItem.appwriteStatus === 'active' && "Work in progress..."}
                {marketItem.appwriteStatus === 'seller_confirmed_delivery' && "Work delivered. Please verify and confirm."}
            </div>

          </div>
        )}

        {/* --- FOOD ORDER ACTIONS (Simple Flow) --- */}
        {item.type === "Food Order" && !item.status.includes("Delivered") && (
             <div className="mt-3 pt-3 border-t border-border/50 flex justify-end gap-2">
                {item.isUserProvider ? (
                    <>
                        {(item as any).orderStatus === "Pending Confirmation" && <Button size="sm" onClick={() => onAction("food_update", item.id, { status: "Confirmed" })}>Accept</Button>}
                        {(item as any).orderStatus === "Confirmed" && <Button size="sm" onClick={() => onAction("food_update", item.id, { status: "Preparing" })}>Start Cooking</Button>}
                        {(item as any).orderStatus === "Preparing" && <Button size="sm" onClick={() => onAction("food_update", item.id, { status: "Out for Delivery" })}>Dispatch</Button>}
                    </>
                ) : (
                    (item as any).orderStatus === "Out for Delivery" && (
                        <Button size="sm" className="bg-green-600" onClick={() => onAction("food_update", item.id, { status: "Delivered" })}>Confirm Receipt</Button>
                    )
                )}
             </div>
        )}

        <div className="flex justify-between items-center text-[10px] text-muted-foreground/70 mt-2">
           <span>{item.isUserProvider ? "You are Provider" : "You are Client"}</span>
           <span className="font-mono">ID: {item.id.substring(0, 6)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// --- MAIN PAGE ---
const TrackingPage = () => {
  const { user } = useAuth();
  const { orders: foodOrders } = useFoodOrders();
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    if (!user?.$id) return;
    setIsLoading(true);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID, 
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [Query.or([Query.equal('buyerId', user.$id), Query.equal('sellerId', user.$id)]), Query.orderDesc('$createdAt')]
      );

      const transactions = response.documents.map((doc: any) => ({
        id: doc.$id,
        type: doc.type === 'service' ? 'Service' : doc.type === 'errand' ? 'Errand' : doc.type === 'product' ? 'Transaction' : 'Rental', 
        productId: doc.productId,
        productTitle: doc.productTitle,
        description: doc.productTitle,
        status: mapAppwriteStatusToTrackingStatus(doc.status),
        appwriteStatus: doc.status,
        date: new Date(doc.$createdAt).toLocaleDateString(),
        timestamp: new Date(doc.$createdAt).getTime(),
        amount: doc.amount,
        sellerName: doc.sellerName,
        buyerName: doc.buyerName,
        sellerId: doc.sellerId,
        buyerId: doc.buyerId,
        isUserProvider: doc.sellerId === user.$id,
        handoverEvidenceUrl: doc.handoverEvidenceUrl,
        isDisputed: doc.isDisputed,
        ambassadorDelivery: doc.ambassadorDelivery,
        ambassadorMessage: doc.ambassadorMessage
      } as MarketTransactionItem));

      const foodItems = foodOrders.map(o => ({
        id: o.$id, 
        type: "Food Order", 
        offeringTitle: o.offeringTitle,
        description: o.offeringTitle,
        status: o.status,
        orderStatus: o.status,
        totalAmount: o.totalAmount, 
        providerName: o.providerName, 
        buyerName: o.buyerName,
        providerId: o.providerId,
        buyerId: o.buyerId,
        isUserProvider: o.providerId === user.$id, 
        timestamp: new Date(o.$createdAt).getTime(),
        date: new Date(o.$createdAt).toLocaleDateString(), 
        quantity: o.quantity, 
        deliveryLocation: o.deliveryLocation,
      } as FoodOrderItem));

      setItems([...transactions, ...foodItems].sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) { toast.error("Sync failed."); } 
    finally { setIsLoading(false); }
  }, [user, foodOrders]);

  useEffect(() => { refreshData(); }, [refreshData]);

  // --- ACTIONS ---
  const handleAction = async (action: string, id: string, payload?: any) => {
    try {
        // Payment Flow
        if (action === "mark_paid_by_buyer") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, {
                status: "payment_confirmed_to_developer" // Escrow holding
            });
            toast.success("Payment initiated. Waiting for confirmation.");
        }
        else if (action === "start_work") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, {
                status: "active" // Active work
            });
            toast.success("Work started!");
        }
        else if (action === "deliver_work") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, {
                status: "seller_confirmed_delivery"
            });
            toast.success("Work marked as delivered.");
        }
        else if (action === "complete_transaction") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, {
                status: "completed"
            });
            toast.success("Transaction Complete! Funds released.");
        }
        // Food
        else if (action === "food_update") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID, id, {
                status: payload.status
            });
            toast.success(`Order updated: ${payload.status}`);
        }
        
        refreshData();
    } catch (e) {
        toast.error("Action failed.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black italic tracking-tight text-foreground">
                ACTIVITY<span className="text-secondary-neon">LOG</span>
            </h1>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        
        <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1">
                <TabsTrigger value="all" className="text-xs font-bold">Active</TabsTrigger>
                <TabsTrigger value="history" className="text-xs font-bold">History</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4 pt-4">
                 {items.filter(i => !i.status.includes('Completed') && i.status !== 'Cancelled' && !(i as any).isDisputed).map(item => (
                    <TrackingCard key={item.id} item={item} onAction={handleAction} currentUser={user} />
                ))}
            </TabsContent>
            <TabsContent value="history" className="space-y-4 pt-4">
                 {items.filter(i => i.status.includes('Completed') || i.status === 'Cancelled' || (i as any).isDisputed).map(item => (
                    <TrackingCard key={item.id} item={item} onAction={handleAction} currentUser={user} />
                ))}
            </TabsContent>
        </Tabs>
      </div>
      <MadeWithDyad />
    </div>
  );
};

// Simple Icon for Service
const BriefcaseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
);

const PackageCheck = ({className}:{className?:string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22v-9"/><path d="m9 12 2 2 4-4"/></svg>
);

export default TrackingPage;