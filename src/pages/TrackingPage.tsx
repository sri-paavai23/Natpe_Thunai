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
  AlertTriangle, ShieldCheck, XCircle, PackageCheck,
  MessageCircle, Briefcase, Wallet, Lock, MapPin, Ban
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
import { DEVELOPER_UPI_ID } from "@/lib/config";

// --- CONFIG ---
const CLOUD_NAME = "dpusuqjvo";
const UPLOAD_PRESET = "natpe_thunai_preset";

// --- HELPERS ---
const uploadToCloudinary = async (file: File): Promise<string> => {
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
    "commission_deducted": "Active / In Progress",
    "active": "Active / In Progress",
    "seller_confirmed_delivery": "Work Done / Delivered",
    "meeting_scheduled": "Meeting Scheduled",
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
  transactionId?: string;
  handoverEvidenceUrl?: string;
  returnEvidenceUrl?: string;
  isDisputed?: boolean;
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

// --- COMPONENT: EVIDENCE MODAL ---
const EvidenceModal = ({ isOpen, onClose, title, onUpload, isUploading, viewOnlyUrl }: any) => {
  const [file, setFile] = useState<File | null>(null);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Camera className="h-5 w-5 text-secondary-neon"/> {title}</DialogTitle></DialogHeader>
        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-input rounded-xl bg-muted/20 min-h-[200px]">
          {viewOnlyUrl ? <img src={viewOnlyUrl} alt="Evidence" className="max-h-[300px] rounded-md object-contain" /> : (
            file ? (
                <div className="relative w-full"><img src={URL.createObjectURL(file)} alt="Preview" className="max-h-[250px] w-full object-contain rounded-md" /><Button size="sm" variant="destructive" className="absolute top-2 right-2 h-7 px-2" onClick={() => setFile(null)}><XCircle className="h-4 w-4" /></Button></div>
            ) : (
                <label className="cursor-pointer flex flex-col items-center gap-3 py-6 w-full hover:bg-muted/30 transition-colors rounded-lg"><Camera className="h-8 w-8 text-secondary-neon" /><span className="text-sm">Click to Capture</span><input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && setFile(e.target.files[0])} /></label>
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
                <DialogHeader><DialogTitle>Verify Payment</DialogTitle><DialogDescription>Payment of <b className="text-foreground">₹{amount}</b> initiated. Enter UTR to confirm.</DialogDescription></DialogHeader>
                <div className="space-y-2 py-4"><Label>Transaction ID / UTR</Label><Input placeholder="e.g. 329183920192" value={utr} onChange={(e) => setUtr(e.target.value)} /></div>
                <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => onVerify(utr)} disabled={utr.length < 4} className="bg-green-600 text-white hover:bg-green-700"><CheckCircle className="h-4 w-4 mr-2" /> Verify</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// --- COMPONENT: TRACKING CARD ---
const TrackingCard = ({ item, onAction, currentUser, onChat }: { item: TrackingItem, onAction: (action: string, id: string, payload?: any) => void, currentUser: any, onChat: (item: TrackingItem) => void }) => {
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
  
  const isCompleted = 
    item.status.toLowerCase().includes('completed') || 
    item.status.toLowerCase().includes('delivered') || 
    item.status === 'Cancelled' || 
    item.status === 'Disputed';

  const getIcon = () => {
    switch (item.type) {
      case "Rental": return <Clock className="h-5 w-5 text-purple-500" />;
      case "Transaction": return <ShoppingBag className="h-5 w-5 text-blue-500" />;
      case "Service": return <Briefcase className="h-5 w-5 text-indigo-500" />;
      case "Errand": return <PackageCheck className="h-5 w-5 text-pink-500" />;
      case "Food Order": return <Utensils className="h-5 w-5 text-orange-500" />;
      case "Cash Exchange": return <IndianRupee className="h-5 w-5 text-green-600" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const initiatePayment = () => {
      if(!marketItem) return;
      const upiLink = `upi://pay?pa=${DEVELOPER_UPI_ID}&pn=NatpeThunaiEscrow&am=${marketItem.amount}&tn=Payment for ${marketItem.productTitle}`;
      window.open(upiLink, '_blank');
      setShowPaymentModal(true);
  };

  const partnerName = item.isUserProvider ? (item as any).buyerName : (item.type === 'Food Order' ? (item as any).providerName : (item as any).sellerName);

  return (
    <Card className={cn("border-l-4 transition-all bg-card shadow-sm mb-4 group hover:shadow-md animate-in fade-in zoom-in-95 duration-300", 
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

        {/* --- ACTIONS --- */}
        <div className="mb-3 w-full space-y-2">
            <Button 
                size="sm" 
                variant="outline" 
                className={cn(
                    "h-8 gap-2 w-full transition-all",
                    isCompleted 
                        ? "bg-muted/50 text-muted-foreground border-dashed" 
                        : "border-secondary-neon/50 text-secondary-neon hover:bg-secondary-neon/10"
                )}
                onClick={() => onChat(item)}
                disabled={isCompleted}
            >
                {isCompleted ? <Ban className="h-3 w-3" /> : <MessageCircle className="h-4 w-4" />}
                {isCompleted ? "Chat Locked (Deal Closed)" : `Chat with ${partnerName ? partnerName.split(' ')[0] : 'User'}`}
            </Button>

            {/* --- PAY BUTTON --- */}
            {marketItem && item.type !== 'Cash Exchange' && !item.isUserProvider && (marketItem.appwriteStatus === 'negotiating' || marketItem.appwriteStatus === 'initiated') && (
                <Button 
                    size="sm" 
                    className="h-8 w-full bg-green-600 hover:bg-green-700 text-white gap-2 font-semibold shadow-sm" 
                    onClick={initiatePayment}
                >
                    <Wallet className="h-3 w-3" /> Pay Escrow (₹{marketItem.amount})
                </Button>
            )}
        </div>

        {/* --- CASH EXCHANGE VIEW --- */}
        {item.type === 'Cash Exchange' && !isCompleted && (
            <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-lg border border-green-200 dark:border-green-800 mb-3 text-center">
                <p className="text-xs text-muted-foreground mb-2">Meet in person to exchange cash.</p>
                <div className="text-[10px] text-muted-foreground italic">Use the Listings page to mark completed.</div>
            </div>
        )}

        {/* --- MARKET LOGIC --- */}
        {marketItem && item.type !== 'Cash Exchange' && (
          <div className="bg-muted/20 p-3 rounded-lg border border-border/50 mb-3 space-y-3">
            <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Amount: <b className="text-foreground flex items-center gap-0.5"><IndianRupee className="h-3 w-3"/>{marketItem.amount}</b></span>
                {marketItem.appwriteStatus === 'negotiating' && <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-[4px] text-[10px] font-bold">Negotiating</span>}
            </div>

            <div className="flex flex-col gap-2">
                {item.type === 'Rental' && (
                    <>
                        {item.isUserProvider && !marketItem.handoverEvidenceUrl && marketItem.appwriteStatus === 'commission_deducted' && (
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs" onClick={() => { setEvidenceMode("upload_handover"); setShowEvidenceModal(true); }}>
                                <Camera className="h-3 w-3 mr-2" /> Upload Handover Proof
                            </Button>
                        )}
                        {!item.isUserProvider && marketItem.handoverEvidenceUrl && marketItem.appwriteStatus === 'commission_deducted' && (
                            <div className="flex gap-2">
                                <Button variant="outline" className="flex-1 h-9 text-xs" onClick={() => { setEvidenceMode("view_handover"); setShowEvidenceModal(true); }}>View Proof</Button>
                                <Button className="flex-1 bg-green-600 text-white h-9 text-xs" onClick={() => onAction("accept_handover", item.id)}>
                                    <Handshake className="h-3 w-3 mr-2" /> Accept & Rent
                                </Button>
                            </div>
                        )}
                        {item.isUserProvider && marketItem.appwriteStatus === 'active' && (
                            <div className="flex gap-2 pt-2 border-t border-border/50">
                                <Button variant="destructive" className="flex-1 h-9 text-xs" onClick={() => { setEvidenceMode("upload_return"); setShowEvidenceModal(true); }}>Report Damage</Button>
                                <Button className="flex-1 bg-green-600 text-white h-9 text-xs" onClick={() => onAction("confirm_completion", item.id)}>Return Verified</Button>
                            </div>
                        )}
                    </>
                )}

                {(item.type === 'Service' || item.type === 'Errand' || item.type === 'Transaction') && (
                    <>
                        {item.isUserProvider && (marketItem.appwriteStatus === 'payment_confirmed_to_developer' || marketItem.appwriteStatus === 'commission_deducted') && (
                            <Button className="w-full bg-blue-600 text-white h-9 text-xs" onClick={() => onAction(item.type === 'Transaction' ? "mark_delivered" : "start_work", item.id)}>
                                {item.type === 'Transaction' ? 'Mark Delivered' : 'Start Work'}
                            </Button>
                        )}
                        {item.isUserProvider && marketItem.appwriteStatus === 'active' && (
                            <Button className="w-full bg-purple-600 text-white h-9 text-xs" onClick={() => onAction("deliver_work", item.id)}>
                                <PackageCheck className="h-3 w-3 mr-2" /> Mark Completed
                            </Button>
                        )}
                        {!item.isUserProvider && marketItem.appwriteStatus === 'seller_confirmed_delivery' && (
                            <Button className="w-full bg-green-600 text-white h-9 text-xs" onClick={() => onAction("confirm_receipt_sale", item.id, { productId: marketItem.productId })}>
                                <CheckCircle className="h-3 w-3 mr-2" /> Confirm & Release Pay
                            </Button>
                        )}
                    </>
                )}
            </div>
          </div>
        )}

        {/* --- FOOD ACTIONS --- */}
        {item.type === "Food Order" && !item.status.includes("Delivered") && (
             <div className="mt-3 pt-3 border-t border-border/50 flex justify-end gap-2">
                {item.isUserProvider ? (
                    <>
                        {(item as any).orderStatus === "Pending Confirmation" && <Button size="sm" onClick={() => onAction("food_update", item.id, { status: "Confirmed" })}>Accept Order</Button>}
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
            <EvidenceModal isOpen={showEvidenceModal} onClose={() => setShowEvidenceModal(false)} title={evidenceMode.includes('upload') ? "Upload Proof" : "View Proof"} onUpload={handleEvidenceUpload} isUploading={isUploading} viewOnlyUrl={evidenceMode === 'view_handover' ? marketItem.handoverEvidenceUrl : undefined} />
        )}

        {showPaymentModal && marketItem && (
            <PaymentVerificationModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} onVerify={(utr) => { onAction("verify_payment", item.id, { utr }); setShowPaymentModal(false); }} amount={marketItem.amount} />
        )}

        <div className="flex justify-between items-center text-[10px] text-muted-foreground/70 mt-3 pt-2 border-t border-border/30">
           <span>Role: {item.isUserProvider ? "Provider" : "Client"}</span>
           <span className="font-mono opacity-50">ID: {item.id.substring(0, 6)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// --- DATA PROCESSING HELPERS ---
const processTransactionDoc = (doc: any, currentUserId: string): MarketTransactionItem => {
    let type: MarketTransactionItem['type'] = 'Transaction';
    if (doc.type === 'service') type = 'Service';
    else if (doc.type === 'errand') type = 'Errand';
    else if (doc.type === 'rent') type = 'Rental';
    else if (doc.type === 'cash-exchange') type = 'Cash Exchange';

    return {
        id: doc.$id,
        type: type,
        productId: doc.productId,
        productTitle: doc.productTitle || "Untitled Item",
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
        isUserProvider: doc.sellerId === currentUserId,
        handoverEvidenceUrl: doc.handoverEvidenceUrl,
        isDisputed: doc.isDisputed
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
        quantity: doc.quantity,
        deliveryLocation: doc.deliveryLocation
    };
};

// --- MAIN PAGE ---
const TrackingPage = () => {
  const { user, userProfile } = useAuth();
  const { orders: initialFoodOrders } = useFoodOrders();
  const [items, setItems] = useState<TrackingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // --- HELPER: LOCK CHAT ROOM ---
  const lockChatRoom = async (transactionId: string) => {
    try {
        const rooms = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_CHAT_ROOMS_COLLECTION_ID,
            [Query.equal('transactionId', transactionId)]
        );
        if (rooms.documents.length > 0) {
            await databases.updateDocument(
                APPWRITE_DATABASE_ID,
                APPWRITE_CHAT_ROOMS_COLLECTION_ID,
                rooms.documents[0].$id,
                { status: "closed" }
            );
            console.log("🔒 Chat room locked for transaction:", transactionId);
        }
    } catch (error) {
        console.error("Failed to lock chat room:", error);
    }
  };

  // --- INITIAL DATA FETCH ---
  const refreshData = useCallback(async () => {
    if (!user?.$id) return;
    setIsLoading(true);
    try {
      const response = await databases.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, [Query.or([Query.equal('buyerId', user.$id), Query.equal('sellerId', user.$id)]), Query.orderDesc('$createdAt')]);
      
      const uniqueItemsMap = new Map<string, TrackingItem>();

      response.documents.forEach((doc: any) => {
        const item = processTransactionDoc(doc, user.$id);
        uniqueItemsMap.set(item.id, item);
      });

      initialFoodOrders.forEach(o => {
        const item = processFoodDoc(o, user.$id);
        uniqueItemsMap.set(item.id, item);
      });

      const sortedItems = Array.from(uniqueItemsMap.values()).sort((a, b) => b.timestamp - a.timestamp);
      setItems(sortedItems);

    } catch (e) { toast.error("Sync failed."); } 
    finally { setIsLoading(false); }
  }, [user, initialFoodOrders]);

  // --- REAL-TIME SUBSCRIPTION ---
  useEffect(() => {
    if (!user?.$id) return;
    refreshData();

    const unsubscribe = databases.client.subscribe(
        [
            `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TRANSACTIONS_COLLECTION_ID}.documents`,
            `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_FOOD_ORDERS_COLLECTION_ID}.documents`
        ],
        (response) => {
            const doc = response.payload as any;
            const eventType = response.events[0];

            const isRelevant = 
                doc.buyerId === user.$id || 
                doc.sellerId === user.$id || 
                doc.providerId === user.$id;

            if (isRelevant) {
                setItems((prevItems) => {
                    const newItemsMap = new Map(prevItems.map(i => [i.id, i]));
                    let newItem: TrackingItem | null = null;

                    if (doc.productTitle) { 
                        newItem = processTransactionDoc(doc, user.$id);
                    } else if (doc.offeringTitle) { 
                        newItem = processFoodDoc(doc, user.$id);
                    }

                    if (newItem) {
                        if (eventType.includes('.delete')) {
                            newItemsMap.delete(newItem.id);
                        } else {
                            newItemsMap.set(newItem.id, newItem);
                        }
                    }
                    return Array.from(newItemsMap.values()).sort((a, b) => b.timestamp - a.timestamp);
                });
            }
        }
    );

    return () => { unsubscribe(); };
  }, [user, refreshData]);

  // --- ACTIONS ---
  const handleChatNavigation = async (item: TrackingItem) => {
    // 1. SAFETY GUARD: Check completion status
    const isCompleted = item.status.toLowerCase().includes('completed') || 
                        item.status.toLowerCase().includes('delivered') ||
                        item.status === 'Cancelled' || 
                        item.status === 'Disputed';

    if (isCompleted) {
        toast.info("Safety First: Chat is closed for completed transactions.");
        return;
    }

    try {
        const rooms = await databases.listDocuments(APPWRITE_DATABASE_ID, APPWRITE_CHAT_ROOMS_COLLECTION_ID, [Query.equal('transactionId', item.id)]);
        if (rooms.documents.length > 0) {
            navigate(`/chat/${rooms.documents[0].$id}`);
        } else {
            const marketItem = item as MarketTransactionItem;
            const buyerId = item.isUserProvider ? marketItem.buyerId : user!.$id;
            const providerId = item.isUserProvider ? user!.$id : marketItem.sellerId;
            const buyerName = item.isUserProvider ? marketItem.buyerName : user!.name;
            const providerName = item.isUserProvider ? user!.name : marketItem.sellerName;

            const newRoom = await databases.createDocument(APPWRITE_DATABASE_ID, APPWRITE_CHAT_ROOMS_COLLECTION_ID, ID.unique(), {
                transactionId: item.id, serviceId: item.description, buyerId, providerId, buyerUsername: buyerName, providerUsername: providerName, status: "active", collegeName: userProfile?.collegeName || "Unknown"
            });
            navigate(`/chat/${newRoom.$id}`);
        }
    } catch (e) { toast.error("Failed to open chat."); }
  };

  const handleAction = async (action: string, id: string, payload?: any) => {
    try {
        if (action === "verify_payment") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { status: "payment_confirmed_to_developer", transactionId: payload.utr });
            toast.success("Payment verified! Work can begin.");
        }
        else if (action === "upload_handover_evidence") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { handoverEvidenceUrl: payload.url });
            toast.success("Proof uploaded.");
        }
        else if (action === "accept_handover" || action === "start_work") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { status: "active" });
            toast.success("Started!");
        }
        // FIXED: Isolated logic for marking delivered/completed
        else if (action === "deliver_work" || action === "mark_delivered") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { status: "seller_confirmed_delivery" });
            toast.success("Marked Delivered.");
        }
        else if (action === "confirm_receipt_sale" || action === "confirm_completion") {
            // MARK COMPLETED -> LOCK CHAT
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, { status: "completed" });
            if (payload?.productId) { try { await databases.deleteDocument(APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID, payload.productId); } catch {} }
            await lockChatRoom(id); // TRIGGER LOCK
            toast.success("Completed! Chat has been closed.");
        }
        else if (action === "food_update") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID, id, { status: payload.status });
            if (payload.status === "Delivered") {
                await lockChatRoom(id); // TRIGGER LOCK FOR FOOD
                toast.success("Order Delivered! Chat closed.");
            } else {
                toast.success("Updated.");
            }
        }
    } catch (e: any) { 
        console.error("Action Failed:", e);
        // UPDATED: Show specific error message from database
        toast.error("Action Failed: " + (e.message || "Unknown error")); 
    }
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
                 {items.filter(i => !i.status.toLowerCase().includes('completed') && i.status !== 'Cancelled' && !(i as any).isDisputed).length === 0 && <div className="text-center text-muted-foreground text-sm py-10">No active tasks.</div>}
                 {items.filter(i => !i.status.toLowerCase().includes('completed') && i.status !== 'Cancelled' && !(i as any).isDisputed).map(item => (
                    <TrackingCard key={item.id} item={item} onAction={handleAction} currentUser={user} onChat={handleChatNavigation} />
                ))}
            </TabsContent>
            <TabsContent value="history" className="space-y-4 pt-4">
                 {items.filter(i => i.status.toLowerCase().includes('completed') || i.status === 'Cancelled' || (i as any).isDisputed).length === 0 && <div className="text-center text-muted-foreground text-sm py-10">No history yet.</div>}
                 {items.filter(i => i.status.toLowerCase().includes('completed') || i.status === 'Cancelled' || (i as any).isDisputed).map(item => (
                    <TrackingCard key={item.id} item={item} onAction={handleAction} currentUser={user} onChat={handleChatNavigation} />
                ))}
            </TabsContent>
        </Tabs>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default TrackingPage;