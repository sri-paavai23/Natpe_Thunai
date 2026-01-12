"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Truck, DollarSign, Loader2, Utensils, CheckCircle, 
  Handshake, Clock, ShoppingBag, Activity, Camera, 
  AlertTriangle, Eye, ShieldCheck, XCircle, PackageCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_PRODUCTS_COLLECTION_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Query } from "appwrite";
import { useFoodOrders, FoodOrder } from "@/hooks/useFoodOrders";

// --- CLOUDINARY CONFIGURATION ---
const CLOUD_NAME = "dpusuqjvo";
const UPLOAD_PRESET = "natpe_thunai_preset"; 

const uploadToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: formData,
    });
    
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Image upload failed");
    }
    
    const data = await res.json();
    return data.secure_url; 
  } catch (error: any) {
    console.error("Cloudinary Upload Error:", error);
    throw new Error(error.message || "Upload failed");
  }
};

// --- INTERFACES ---
export interface BaseTrackingItem {
  id: string;
  description: string;
  date: string;
  status: string; // Ensure this exists on Base
  isUserProvider: boolean;
  timestamp: number;
  ambassadorDelivery?: boolean;
  ambassadorMessage?: string;
}

export interface MarketTransactionItem extends BaseTrackingItem {
  type: "Transaction" | "Cash Exchange" | "Service" | "Rental";
  productId?: string;
  productTitle: string;
  amount: number;
  sellerName: string;
  buyerName: string;
  sellerId: string;
  buyerId: string;
  appwriteStatus: string;
  
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
    quantity: number;
    orderStatus: FoodOrder["status"];
    providerId: string;
    buyerId: string;
}

type TrackingItem = MarketTransactionItem | FoodOrderItem;

// --- UTILS ---
const mapAppwriteStatusToTrackingStatus = (status: string): string => {
  const map: Record<string, string> = {
    "initiated": "Payment Pending",
    "payment_confirmed_to_developer": "Processing",
    "commission_deducted": "Handover Pending",
    "active": "In Use / Active",
    "seller_confirmed_delivery": "Delivered",
    "meeting_scheduled": "Meeting Set",
    "completed": "Completed",
    "failed": "Cancelled",
    "disputed": "Disputed / Damage Reported"
  };
  return map[status] || "Pending";
};

// --- COMPONENT: EVIDENCE MODAL ---
const EvidenceModal = ({ 
  isOpen, onClose, title, onUpload, isUploading, viewOnlyUrl 
}: { 
  isOpen: boolean; onClose: () => void; title: string; onUpload?: (file: File) => void; isUploading?: boolean; viewOnlyUrl?: string; 
}) => {
  const [file, setFile] = useState<File | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-secondary-neon" /> {title}
          </DialogTitle>
          <DialogDescription>{viewOnlyUrl ? "Proof of condition." : "Take a clear photo to avoid disputes."}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-input rounded-xl bg-muted/20 min-h-[200px]">
          {viewOnlyUrl ? (
            <img src={viewOnlyUrl} alt="Evidence" className="max-h-[300px] rounded-md object-contain" />
          ) : (
            <>
              {file ? (
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
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {!viewOnlyUrl && onUpload && (
            <Button onClick={() => file && onUpload(file)} disabled={!file || isUploading} className="bg-secondary-neon text-primary-foreground font-bold">
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Evidence"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- COMPONENT: TRACKING CARD ---
const TrackingCard = ({ item, onAction }: { item: TrackingItem, onAction: (action: string, id: string, payload?: any) => void }) => {
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [evidenceMode, setEvidenceMode] = useState<"upload_handover" | "upload_return" | "view_handover">("view_handover");
  const [isUploading, setIsUploading] = useState(false);

  const handleEvidenceUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const fileUrl = await uploadToCloudinary(file);
      
      const actionType = evidenceMode === "upload_handover" ? "upload_handover_evidence" : "report_damage_with_evidence";
      onAction(actionType, item.id, { url: fileUrl });
      setShowEvidenceModal(false);
    } catch (e: any) {
      toast.error(`Upload failed: ${e.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const isMarket = item.type !== "Food Order";
  const marketItem = isMarket ? (item as MarketTransactionItem) : null;
  const requiresHandshake = item.type === "Rental"; 

  const getIcon = () => {
    switch (item.type) {
      case "Rental": return <Clock className="h-5 w-5 text-purple-500" />;
      case "Transaction": return <ShoppingBag className="h-5 w-5 text-blue-500" />;
      case "Food Order": return <Utensils className="h-5 w-5 text-orange-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card className={cn("border-l-4 transition-all bg-card shadow-sm mb-4 group hover:shadow-md", 
      item.isUserProvider ? "border-l-secondary-neon" : "border-l-blue-500",
      marketItem?.isDisputed && "border-l-destructive border-destructive/50 bg-destructive/5"
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
            {marketItem?.isDisputed ? "Disputed" : item.status}
          </Badge>
        </div>

        {/* --- HANDSHAKE UI (Rentals Only) --- */}
        {requiresHandshake && marketItem && (
          <div className="bg-muted/20 p-3 rounded-lg border border-border/50 mb-3 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1 pb-1">
                <span className={cn(marketItem.handoverEvidenceUrl ? "text-green-500 font-bold" : "")}>1. Proof</span>
                <div className="h-[1px] flex-1 bg-border mx-2" />
                <span className={cn(marketItem.appwriteStatus === 'active' ? "text-blue-500 font-bold" : "")}>2. Active</span>
                <div className="h-[1px] flex-1 bg-border mx-2" />
                <span className={cn(marketItem.status.includes('Completed') ? "text-green-500 font-bold" : "")}>3. Done</span>
            </div>

            <div className="flex items-center gap-3">
                <div className={cn("flex-1 p-2 rounded border text-xs flex items-center justify-between", marketItem.handoverEvidenceUrl ? "bg-green-500/10 border-green-500/20" : "bg-card border-dashed")}>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className={cn("h-4 w-4", marketItem.handoverEvidenceUrl ? "text-green-600" : "text-muted-foreground")} />
                        <span className="font-medium">Condition Proof</span>
                    </div>
                    {marketItem.handoverEvidenceUrl ? (
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEvidenceMode("view_handover"); setShowEvidenceModal(true); }}>
                            <Eye className="h-3 w-3 text-green-600" />
                        </Button>
                    ) : (
                        <span className="text-[9px] italic text-muted-foreground">Required</span>
                    )}
                </div>
            </div>

            {/* Handshake Actions */}
            {item.isUserProvider && !marketItem.handoverEvidenceUrl && (marketItem.appwriteStatus === 'commission_deducted' || marketItem.appwriteStatus === 'initiated') && (
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs font-bold" onClick={() => { setEvidenceMode("upload_handover"); setShowEvidenceModal(true); }}>
                    <Camera className="h-3 w-3 mr-2" /> Upload Handover Proof
                </Button>
            )}

            {!item.isUserProvider && marketItem.handoverEvidenceUrl && marketItem.appwriteStatus !== 'active' && !marketItem.appwriteStatus.includes('completed') && (
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-9 text-xs" onClick={() => { setEvidenceMode("view_handover"); setShowEvidenceModal(true); }}>View Proof</Button>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9 text-xs font-bold" onClick={() => onAction("accept_handover", item.id, { type: item.type })}>
                        <Handshake className="h-3 w-3 mr-2" /> Accept & Start
                    </Button>
                </div>
            )}

            {item.isUserProvider && marketItem.appwriteStatus === 'active' && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                    <p className="text-[10px] text-center text-muted-foreground">Rental complete? Verify return.</p>
                    <div className="flex gap-2">
                        <Button variant="destructive" className="flex-1 h-9 text-xs" onClick={() => { setEvidenceMode("upload_return"); setShowEvidenceModal(true); }}>
                            <AlertTriangle className="h-3 w-3 mr-2" /> Report Damage
                        </Button>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9 text-xs font-bold" onClick={() => onAction("confirm_completion", item.id)}>
                            <CheckCircle className="h-3 w-3 mr-2" /> All Good
                        </Button>
                    </div>
                </div>
            )}
          </div>
        )}

        {/* --- SIMPLE FLOW UI (Sales - No Evidence) --- */}
        {!requiresHandshake && marketItem && !marketItem.status.includes('Completed') && (
            <div className="mt-3 pt-3 border-t border-border/50 flex justify-end gap-2">
                {item.isUserProvider && (marketItem.appwriteStatus === 'commission_deducted' || marketItem.appwriteStatus === 'initiated') && (
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs font-bold" onClick={() => onAction("mark_delivered", item.id)}>
                        <PackageCheck className="h-3 w-3 mr-2" /> Mark Delivered
                    </Button>
                )}
                {!item.isUserProvider && marketItem.appwriteStatus === 'seller_confirmed_delivery' && (
                    <Button className="bg-green-600 hover:bg-green-700 text-white h-9 text-xs font-bold" onClick={() => onAction("confirm_receipt_sale", item.id, { productId: marketItem.productId })}>
                        <CheckCircle className="h-3 w-3 mr-2" /> Confirm Receipt
                    </Button>
                )}
                {item.isUserProvider && marketItem.appwriteStatus === 'seller_confirmed_delivery' && (
                    <span className="text-xs text-muted-foreground italic">Waiting for buyer confirmation...</span>
                )}
                {!item.isUserProvider && marketItem.appwriteStatus === 'initiated' && (
                    <span className="text-xs text-muted-foreground italic">Waiting for seller to deliver...</span>
                )}
            </div>
        )}

        {/* --- FOOD ORDER ACTIONS --- */}
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

        {/* Modals & Footer */}
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

        <div className="flex justify-between items-center text-[10px] text-muted-foreground/70 mt-3 pt-2 border-t border-border/30">
           <span>Role: {item.isUserProvider ? "Seller" : "Buyer"}</span>
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
        type: doc.type === 'product' ? 'Transaction' : 'Rental', 
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
        ambassadorDelivery: o.ambassadorDelivery,
        ambassadorMessage: o.ambassadorMessage
      } as FoodOrderItem));

      setItems([...transactions, ...foodItems].sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) { toast.error("Sync failed."); } 
    finally { setIsLoading(false); }
  }, [user, foodOrders]);

  useEffect(() => { refreshData(); }, [refreshData]);

  // --- ACTIONS ---
  const handleAction = async (action: string, id: string, payload?: any) => {
    try {
        // --- HANDSHAKE ACTIONS (Rentals Only) ---
        if (action === "upload_handover_evidence") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, {
                handoverEvidenceUrl: payload.url
            });
            toast.success("Proof uploaded. Ask buyer to accept.");
        }
        else if (action === "accept_handover") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, {
                status: "active"
            });
            toast.success("Rental started!");
        }
        else if (action === "report_damage_with_evidence") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, {
                status: "disputed", isDisputed: true, returnEvidenceUrl: payload.url
            });
            toast.error("Dispute reported.");
        }

        // --- SIMPLE SALE ACTIONS (Transactions) ---
        else if (action === "mark_delivered") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, {
                status: "seller_confirmed_delivery"
            });
            toast.success("Marked as Delivered.");
        }
        else if (action === "confirm_receipt_sale") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, {
                status: "completed"
            });
            if (payload?.productId) {
                try {
                    await databases.deleteDocument(APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID, payload.productId);
                    toast.success("Transaction Complete! Listing removed.");
                } catch (delError) { console.error("Listing delete failed", delError); }
            } else {
                toast.success("Transaction Complete!");
            }
        }

        // --- GENERIC COMPLETION (Rentals) ---
        else if (action === "confirm_completion") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, id, {
                status: "completed"
            });
            toast.success("Rental Closed.");
        }

        // --- FOOD ACTIONS ---
        else if (action === "food_update") {
            await databases.updateDocument(APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID, id, {
                status: payload.status
            });
            toast.success(`Order updated: ${payload.status}`);
        }
        
        refreshData();
    } catch (e) {
        console.error(e);
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
                    <TrackingCard key={item.id} item={item} onAction={handleAction} />
                ))}
            </TabsContent>
            <TabsContent value="history" className="space-y-4 pt-4">
                 {items.filter(i => i.status.includes('Completed') || i.status === 'Cancelled' || (i as any).isDisputed).map(item => (
                    <TrackingCard key={item.id} item={item} onAction={handleAction} />
                ))}
            </TabsContent>
        </Tabs>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default TrackingPage;