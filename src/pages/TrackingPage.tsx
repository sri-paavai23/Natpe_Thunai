"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Truck, IndianRupee, Loader2, Utensils, CheckCircle, 
  Handshake, Clock, ShoppingBag, Activity, Camera, 
  AlertTriangle, Eye, ShieldCheck, XCircle, PackageCheck,
  MessageCircle, Send, Briefcase, User, Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID,APPWRITE_PRODUCTS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Query, ID } from "appwrite";
import { useFoodOrders, FoodOrder } from "@/hooks/useFoodOrders";
import { DEVELOPER_UPI_ID } from "@/lib/config";

// --- CONSTANTS ---
const CHAT_COLLECTION_ID = "chat_messages";
const CLOUD_NAME = "dpusuqjvo";
const UPLOAD_PRESET = "natpe_thunai_preset";

// --- CLOUDINARY UPLOAD ---
const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });
    
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.secure_url; 
  } catch (error: any) {
    console.error("Cloudinary Error:", error);
    throw new Error("Upload failed");
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
  ambassadorDelivery?: boolean;
  ambassadorMessage?: string;
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
  transactionId?: string; // UTR Number
  
  // Handshake Props
  handoverEvidenceUrl?: string;
  returnEvidenceUrl?: string;
  isDisputed?: boolean;
  disputeReason?: string;
}

export interface FoodOrderItem extends BaseTrackingItem {
    id: string;
    type: "Food Order";
    offeringTitle: string;
    totalAmount: number;
    providerName: string;
    buyerName: string;
    providerId: string;
    buyerId: string;
    quantity: number;
    deliveryLocation: string;
    orderStatus: FoodOrder["status"];
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
    "payment_confirmed_to_developer": "Verifying Payment",
    "commission_deducted": "Active / Handover",
    "active": "Active / In Progress",
    "seller_confirmed_delivery": "Delivered / Done",
    "meeting_scheduled": "Meeting Set",
    "completed": "Completed",
    "failed": "Cancelled",
    "disputed": "Disputed"
  };
  return map[status] || status;
};

// --- COMPONENT: EVIDENCE MODAL ---
const EvidenceModal = ({ isOpen, onClose, title, onUpload, isUploading, viewOnlyUrl }: any) => {
  const [file, setFile] = useState<File | null>(null);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Camera className="h-5 w-5 text-secondary-neon"/> {title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-input rounded-xl bg-muted/20 min-h-[200px]">
          {viewOnlyUrl ? <img src={viewOnlyUrl} alt="Evidence" className="max-h-[300px] rounded-md object-contain" /> : (
            file ? (
                <div className="relative w-full">
                  <img src={URL.createObjectURL(file)} alt="Preview" className="max-h-[250px] w-full object-contain rounded-md" />
                  <Button size="sm" variant="destructive" className="absolute top-2 right-2 h-7 px-2" onClick={() => setFile(null)}><XCircle className="h-4 w-4" /></Button>
                </div>
            ) : (
                <label className="cursor-pointer flex flex-col items-center gap-3 py-6 w-full hover:bg-muted/30 transition-colors rounded-lg">
                  <Camera className="h-8 w-8 text-secondary-neon" />
                  <span className="text-sm">Click to Capture</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
                </label>
            )
          )}
        </div>
        <DialogFooter>
          {!viewOnlyUrl && onUpload && <Button onClick={() => file && onUpload(file)} disabled={!file || isUploading} className="bg-secondary-neon text-primary-foreground">{isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Evidence"}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- COMPONENT: PAYMENT VERIFICATION MODAL ---
const PaymentVerificationModal = ({ isOpen, onClose, onVerify, amount }: { isOpen: boolean, onClose: () => void, onVerify: (tid: string) => void, amount: number }) => {
    const [utr, setUtr] = useState("");
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Verify Payment</DialogTitle>
                    <DialogDescription>
                        You successfully initiated a payment of <b className="text-foreground">₹{amount}</b>. 
                        Please enter the UPI Transaction ID (UTR) below to confirm.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-4">
                    <Label>Transaction ID / UTR</Label>
                    <Input 
                        placeholder="e.g. 329183920192" 
                        value={utr} 
                        onChange={(e) => setUtr(e.target.value)} 
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={() => onVerify(utr)} disabled={utr.length < 4} className="bg-green-600 text-white hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" /> Verify Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// --- COMPONENT: CHAT SHEET ---
const ChatSheet = ({ item, currentUser }: { item: TrackingItem, currentUser: any }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchMessages = useCallback(async () => {
        try {
            const res = await databases.listDocuments(APPWRITE_DATABASE_ID, CHAT_COLLECTION_ID, [
                Query.equal("transactionId", item.id), Query.orderAsc("$createdAt")
            ]);
            setMessages(res.documents as unknown as ChatMessage[]);
        } catch (e) { console.error("Chat error", e); }
    }, [item.id]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        try {
            await databases.createDocument(APPWRITE_DATABASE_ID, CHAT_COLLECTION_ID, ID.unique(), {
                transactionId: item.id, senderId: currentUser.$id, senderName: currentUser.name, text: newMessage, timestamp: new Date().toISOString()
            });
            setNewMessage("");
        } catch (e) { toast.error("Failed to send."); }
    };

    useEffect(() => {
        fetchMessages();
        const unsub = databases.client.subscribe(`databases.${APPWRITE_DATABASE_ID}.collections.${CHAT_COLLECTION_ID}.documents`, (res) => {
            if (res.events.includes("databases.*.collections.*.documents.*.create")) {
                const payload = res.payload as any;
                if (payload.transactionId === item.id) setMessages(prev => [...prev, payload]);
            }
        });
        return () => unsub();
    }, [fetchMessages, item.id]);

    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

    const partnerName = item.isUserProvider ? (item as any).buyerName : (item.type === 'Food Order' ? (item as any).providerName : (item as any).sellerName);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-2 border-secondary-neon/50 text-secondary-neon hover:bg-secondary-neon/10 w-full sm:w-auto">
                    <MessageCircle className="h-4 w-4" /> Chat with {partnerName.split(' ')[0]}
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] flex flex-col p-0">
                <SheetHeader className="p-4 border-b bg-muted/10">
                    <SheetTitle className="text-base flex items-center gap-2"><User className="h-4 w-4"/> {partnerName}</SheetTitle>
                </SheetHeader>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-background">
                    {messages.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground opacity-50 text-sm">
                            <p>No messages yet.</p>
                            <p>Discuss the {item.type} details here.</p>
                        </div>
                    ) : (
                        messages.map(msg => (
                            <div key={msg.$id} className={cn("flex flex-col max-w-[80%]", msg.senderId === currentUser.$id ? "ml-auto items-end" : "mr-auto items-start")}>
                                <div className={cn("px-3 py-2 rounded-lg text-sm", msg.senderId === currentUser.$id ? "bg-secondary-neon text-primary-foreground" : "bg-muted")}>{msg.text}</div>
                                <span className="text-[9px] opacity-50 mt-1">{new Date(msg.$createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                        ))
                    )}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3 border-t flex gap-2">
                    <Input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1" />
                    <Button type="submit" size="icon" className="bg-secondary-neon"><Send className="h-4 w-4" /></Button>
                </form>
            </SheetContent>
        </Sheet>
    );
};

// --- COMPONENT: TRACKING CARD ---
const TrackingCard = ({ item, onAction, currentUser }: { item: TrackingItem, onAction: (action: string, id: string, payload?: any) => void, currentUser: any }) => {
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [evidenceMode, setEvidenceMode] = useState<"upload_handover" | "upload_return" | "view_handover">("view_handover");
  const [isUploading, setIsUploading] = useState(false);

  const handleEvidenceUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const fileUrl = await uploadToCloudinary(file);
      const actionType = evidenceMode === "upload_handover" ? "upload_handover_evidence" : "report_damage_with_evidence";
      onAction(actionType, item.id, { url: fileUrl });
      setShowEvidenceModal(false);
    } catch (e: any) { toast.error(`Upload failed: ${e.message}`); } 
    finally { setIsUploading(false); }
  };

  const isMarket = item.type !== "Food Order";
  const marketItem = isMarket ? (item as MarketTransactionItem) : null;
  const isRental = item.type === "Rental"; 

  const getIcon = () => {
    switch (item.type) {
      case "Rental": return <Clock className="h-5 w-5 text-purple-500" />;
      case "Transaction": return <ShoppingBag className="h-5 w-5 text-blue-500" />;
      case "Service": return <Briefcase className="h-5 w-5 text-indigo-500" />;
      case "Food Order": return <Utensils className="h-5 w-5 text-orange-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const initiatePayment = () => {
      if(!marketItem) return;
      // 1. Open UPI App
      const upiLink = `upi://pay?pa=${DEVELOPER_UPI_ID}&pn=NatpeThunaiEscrow&am=${marketItem.amount}&tn=Payment for ${marketItem.productTitle}`;
      window.open(upiLink, '_blank');
      
      // 2. Open Verification Modal
      setShowPaymentModal(true);
  };

  return (
    <Card className={cn("border-l-4 transition-all bg-card shadow-sm mb-4 group hover:shadow-md", 
      item.isUserProvider ? "border-l-secondary-neon" : "border-l-blue-500",
      marketItem?.isDisputed && "border-l-destructive border-destructive/50"
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

        {/* --- ALWAYS VISIBLE CHAT --- */}
        <div className="mb-3 w-full">
            <ChatSheet item={item} currentUser={currentUser} />
        </div>

        {/* --- MARKET / SERVICE / RENTAL LOGIC --- */}
        {marketItem && (
          <div className="bg-muted/20 p-3 rounded-lg border border-border/50 mb-3 space-y-3 animate-in fade-in">
            
            <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Amount: <b className="text-foreground"><IndianRupee className="inline h-3 w-3"/>{marketItem.amount}</b></span>
                {marketItem.appwriteStatus === 'negotiating' && <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-[4px] text-[10px] font-bold">Negotiating</span>}
            </div>

            {/* --- ACTION BUTTONS --- */}
            <div className="flex flex-col gap-2">
                
                {/* 1. Payment (Buyer) */}
                {!item.isUserProvider && (marketItem.appwriteStatus === 'negotiating' || marketItem.appwriteStatus === 'initiated') && (
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-9 text-xs" onClick={initiatePayment}>
                        <Wallet className="h-3 w-3 mr-2" /> Pay to Start
                    </Button>
                )}

                {/* 2. Handshake (Rentals Only) */}
                {isRental && (
                    <>
                        {item.isUserProvider && !marketItem.handoverEvidenceUrl && marketItem.appwriteStatus === 'commission_deducted' && (
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs" onClick={() => { setEvidenceMode("upload_handover"); setShowEvidenceModal(true); }}>
                                <Camera className="h-3 w-3 mr-2" /> Upload Handover Proof
                            </Button>
                        )}
                        {!item.isUserProvider && marketItem.handoverEvidenceUrl && marketItem.appwriteStatus === 'commission_deducted' && (
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1 h-9 text-xs" onClick={() => { setEvidenceMode("view_handover"); setShowEvidenceModal(true); }}>View Proof</Button>
                                <Button className="flex-1 bg-green-600 text-white h-9 text-xs" onClick={() => onAction("accept_handover", item.id, { type: item.type })}>
                                    <Handshake className="h-3 w-3 mr-2" /> Accept & Rent
                                </Button>
                            </div>
                        )}
                    </>
                )}

                {/* 3. Service/Freelance/Sale Flow */}
                {!isRental && (
                    <>
                        {item.isUserProvider && (marketItem.appwriteStatus === 'payment_confirmed_to_developer' || marketItem.appwriteStatus === 'commission_deducted') && (
                            <Button className="w-full bg-blue-600 text-white h-9 text-xs" onClick={() => onAction(item.type === 'Transaction' ? "mark_delivered" : "start_work", item.id)}>
                                {item.type === 'Transaction' ? 'Mark Delivered' : 'Start Work'}
                            </Button>
                        )}
                        {item.isUserProvider && marketItem.appwriteStatus === 'active' && (
                            <Button className="w-full bg-purple-600 text-white h-9 text-xs" onClick={() => onAction("deliver_work", item.id)}>
                                <PackageCheck className="h-3 w-3 mr-2" /> Mark Work Done
                            </Button>
                        )}
                        {!item.isUserProvider && marketItem.appwriteStatus === 'seller_confirmed_delivery' && (
                            <Button className="w-full bg-green-600 text-white h-9 text-xs" onClick={() => onAction("confirm_receipt_sale", item.id, { productId: marketItem.productId })}>
                                <CheckCircle className="h-3 w-3 mr-2" /> Confirm Completion
                            </Button>
                        )}
                    </>
                )}

                {/* 4. Rental Return */}
                {isRental && item.isUserProvider && marketItem.appwriteStatus === 'active' && (
                    <div className="flex gap-2 pt-2 border-t border-border/50">
                        <Button variant="destructive" className="flex-1 h-9 text-xs" onClick={() => { setEvidenceMode("upload_return"); setShowEvidenceModal(true); }}>Report Damage</Button>
                        <Button className="flex-1 bg-green-600 text-white h-9 text-xs" onClick={() => onAction("confirm_completion", item.id)}>Return Verified</Button>
                    </div>
                )}
            </div>
          </div>
        )}

        {/* --- FOOD ACTIONS --- */}
        {item.type === "Food Order" && !item.status.includes("Delivered") && (
             <div className="mt-3 pt-3 border-t border-border/50 flex justify-end gap-2">
                {item.isUserProvider ? (
                    <>
                        {(item as any).orderStatus === "Pending Confirmation" && <Button size="sm" onClick={() => onAction("food_update", item.id, { status: "Confirmed" })}>Accept</Button>}
                        {(item as any).orderStatus === "Confirmed" && <Button size="sm" onClick={() => onAction("food_update", item.id, { status: "Preparing" })}>Start Cooking</Button>}
                        {(item as any).orderStatus === "Preparing" && <Button size="sm" onClick={() => onAction("food_update", item.id, { status: "Out for Delivery" })}>Dispatch</Button>}
                    </>
                ) : (
                    (item as any).orderStatus === "Out for Delivery" && <Button size="sm" className="bg-green-600" onClick={() => onAction("food_update", item.id, { status: "Delivered" })}>Confirm Receipt</Button>
                )}
             </div>
        )}

        {/* Modals */}
        {showEvidenceModal && marketItem && (
            <EvidenceModal
                isOpen={showEvidenceModal}
                onClose={() => setShowEvidenceModal(false)}
                title={evidenceMode.includes('upload') ? "Upload Proof" : "View Proof"}
                onUpload={handleEvidenceUpload}
                isUploading={isUploading}
                viewOnlyUrl={evidenceMode === 'view_handover' ? marketItem.handoverEvidenceUrl : undefined}
            />
        )}

        {showPaymentModal && marketItem && (
            <PaymentVerificationModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onVerify={(utr) => {
                    onAction("verify_payment", item.id, { utr });
                    setShowPaymentModal(false);
                }}
                amount={marketItem.amount}
            />
        )}

        <div className="flex justify-between items-center text-[10px] text-muted-foreground/70 mt-3 pt-2 border-t border-border/30">
           <span>Role: {item.isUserProvider ? "Provider" : "Client"}</span>
           <span className="font-mono opacity-50">ID: {item.id.substring(0, 6)}</span>
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
        type: doc.type === 'product' ? 'Transaction' : (doc.type === 'service' ? 'Service' : (doc.type === 'errand' ? 'Errand' : 'Rental')), 
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
        if (action === "verify_payment") {
            // Buyer sends UTR -> Status: Verified
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { 
                status: "payment_confirmed_to_developer",
                transactionId: payload.utr // Store UTR
            });
            toast.success("Payment verified! Work can begin.");
        }
        else if (action === "upload_handover_evidence") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { handoverEvidenceUrl: payload.url });
            toast.success("Proof uploaded. Ask buyer to accept.");
        }
        else if (action === "accept_handover") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { status: "active" });
            toast.success("Rental Started");
        }
        else if (action === "report_damage_with_evidence") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { status: "disputed", isDisputed: true, returnEvidenceUrl: payload.url });
            toast.error("Dispute reported.");
        }
        else if (action === "start_work") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { status: "active" });
            toast.success("Work Started");
        }
        else if (action === "deliver_work" || action === "mark_delivered") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { status: "seller_confirmed_delivery" });
            toast.success("Marked as Delivered");
        }
        else if (action === "confirm_receipt_sale") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { status: "completed" });
            if (payload?.productId) {
                try { await databases.deleteDocument(APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID, payload.productId); } catch {}
            }
            toast.success("Completed!");
        }
        else if (action === "confirm_completion") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { status: "completed" });
            toast.success("Completed");
        }
        else if (action === "food_update") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID, id, { status: payload.status });
            toast.success("Order Updated");
        }
        refreshData();
    } catch (e) { toast.error("Action Failed"); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black italic tracking-tight text-foreground">ACTIVITY<span className="text-secondary-neon">LOG</span></h1>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        
        <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1">
                <TabsTrigger value="all" className="text-xs font-bold">Active</TabsTrigger>
                <TabsTrigger value="history" className="text-xs font-bold">History</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4 pt-4">
                 {items.filter(i => !i.status.toLowerCase().includes('completed') && i.status !== 'Cancelled' && !(i as any).isDisputed).map(item => (
                    <TrackingCard key={item.id} item={item} onAction={handleAction} currentUser={user} />
                ))}
            </TabsContent>
            <TabsContent value="history" className="space-y-4 pt-4">
                 {items.filter(i => i.status.toLowerCase().includes('completed') || i.status === 'Cancelled' || (i as any).isDisputed).map(item => (
                    <TrackingCard key={item.id} item={item} onAction={handleAction} currentUser={user} />
                ))}
            </TabsContent>
        </Tabs>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default TrackingPage;