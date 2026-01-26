"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, IndianRupee, Wallet, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { 
  databases, 
  APPWRITE_DATABASE_ID, 
  APPWRITE_FOOD_ORDERS_COLLECTION_ID, // Ensure this is imported
  APPWRITE_TRANSACTIONS_COLLECTION_ID 
} from "@/lib/appwrite";
import { ID } from "appwrite";
import { DEVELOPER_UPI_ID } from "@/lib/config";
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption";

interface PlaceFoodOrderFormProps {
  mode: "buy" | "sell" | "request";
  offering?: any; 
  onSubmit?: (data: any) => void; 
  onOrderPlaced?: () => void;
  onCancel: () => void;
}

const PlaceFoodOrderForm: React.FC<PlaceFoodOrderFormProps> = ({ 
  mode, 
  offering, 
  onSubmit, 
  onOrderPlaced, 
  onCancel 
}) => {
  const { user, userProfile } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // BUY MODE STATE
  const [quantity, setQuantity] = useState(1);
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [notes, setNotes] = useState(""); 
  const [paymentStep, setPaymentStep] = useState<'initial' | 'verify'>('initial');
  const [transactionId, setTransactionId] = useState("");
  
  // Ambassador State
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false);
  const [ambassadorMessage, setAmbassadorMessage] = useState("");

  // SELL/REQUEST MODE STATE
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("homemade-meals");
  const [dietaryType, setDietaryType] = useState("veg");
  const [timeEstimate, setTimeEstimate] = useState("30 min");

  // --- HELPER: ROBUST PRICE PARSER ---
  const parsePrice = (priceStr: string | number): number => {
    if (typeof priceStr === 'number') return priceStr;
    if (!priceStr) return 0;
    const numericPart = priceStr.toString().replace(/[^0-9.]/g, '');
    return parseFloat(numericPart) || 0;
  };

  // --- BUY LOGIC (ORDERING) ---
  const handleInitiatePayment = () => {
    if (!user || !offering) return;
    
    if (!deliveryLocation.trim()) {
        toast.error("Please enter a delivery spot (e.g., Room 304).");
        return;
    }

    // Generic UPI Intent (No parameters to ensure app opens successfully)
    const upiLink = "upi://pay";
    
    // Create hidden link for robust mobile launching
    const link = document.createElement('a');
    link.href = upiLink;
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    
    try {
        link.click();
        toast.info("Opening App...", {
            description: "Please paste the UPI ID and enter the amount manually."
        });
        setPaymentStep('verify');
    } catch (e) {
        toast.error("Could not open UPI app. Please pay manually.");
        setPaymentStep('verify');
    } finally {
        document.body.removeChild(link);
    }
  };

  const handleConfirmOrder = async () => {
    if (isProcessing) return; // Prevent double click
    if (!user || !offering) return;
    if (!transactionId.trim()) {
        toast.error("Please enter the Transaction ID (UTR).");
        return;
    }

    setIsProcessing(true); // LOCK UI
    try {
        const priceVal = parsePrice(offering.price);
        const totalAmount = priceVal * quantity;
        
        // 1. Prepare Order Data for 'food_orders' collection
        const orderData = {
            offeringId: String(offering.$id),
            offeringTitle: String(offering.title).substring(0, 99),
            providerId: String(offering.posterId),
            providerName: String(offering.posterName),
            buyerId: String(user.$id),
            buyerName: String(user.name),
            quantity: Number(quantity),
            totalAmount: Number(totalAmount.toFixed(2)),
            deliveryLocation: String(deliveryLocation),
            status: "Pending Confirmation",
            transactionId: String(transactionId),
            collegeName: String(userProfile?.collegeName || "Unknown"),
            notes: String(notes), 
            ambassadorDelivery: Boolean(ambassadorDelivery), 
            ambassadorMessage: String(ambassadorMessage)
        };

        // 2. Prepare Transaction Data for 'transactions' ledger
        const transactionData = {
            productId: orderData.offeringId,
            productTitle: `Food: ${orderData.offeringTitle} (x${quantity})`,
            buyerId: orderData.buyerId,
            buyerName: orderData.buyerName,
            sellerId: orderData.providerId,
            sellerName: orderData.providerName,
            sellerUpiId: offering.sellerUpiId || "default@upi",
            amount: orderData.totalAmount,
            status: "payment_confirmed_to_developer",
            type: "food",
            collegeName: orderData.collegeName,
            ambassadorDelivery: orderData.ambassadorDelivery,
            utrId: orderData.transactionId,
            isBargain: false
        };

        // 3. Parallel Writes to Correct Collections
        await Promise.all([
            // Primary Order Record -> 'food_orders'
            databases.createDocument(
                APPWRITE_DATABASE_ID, 
                APPWRITE_FOOD_ORDERS_COLLECTION_ID, // <--- EXPLICITLY USING FOOD ORDERS
                ID.unique(), 
                orderData
            ),
            // Financial Record -> 'transactions'
            databases.createDocument(
                APPWRITE_DATABASE_ID, 
                APPWRITE_TRANSACTIONS_COLLECTION_ID, 
                ID.unique(), 
                transactionData
            )
        ]);

        toast.success("Order Placed Successfully!");
        if (onOrderPlaced) onOrderPlaced();

    } catch (error: any) {
        console.error("Order Error:", error);
        toast.error(`Order Failed: ${error.message || "Unknown error"}`);
        setIsProcessing(false); // Unlock only on error
    }
  };

  // --- SELL/REQUEST LOGIC ---
  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return; 

    if (!title || !price || !description) {
      toast.error("Please fill all fields.");
      return;
    }

    setIsProcessing(true); 
    const postData = {
      title, description, price, category, dietaryType, timeEstimate,
      isCustomOrder: mode === "request", status: "active"
    };
    
    // Pass data up to parent (which handles writing to 'services' collection)
    if (onSubmit) onSubmit(postData);
    
    // Simulate delay or wait for parent to close
    setTimeout(() => setIsProcessing(false), 3000); 
  };

  // --- RENDER: BUY MODE ---
  if (mode === "buy" && offering) {
    const priceVal = parsePrice(offering.price);
    const total = (priceVal * quantity).toFixed(0);

    return (
      <div className="space-y-5 pt-2">
        {paymentStep === 'initial' ? (
            <>
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-3 flex items-start gap-3">
                    <div className="p-1 bg-red-100 dark:bg-red-900/30 rounded-full mt-0.5">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-red-700 dark:text-red-400">No Cancellation</h4>
                        <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5 leading-snug">
                            Orders cannot be cancelled once preparation starts.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-[80px_1fr] gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground/80">Qty</Label>
                        <div className="flex items-center justify-center border-2 border-primary/20 rounded-xl h-11 relative overflow-hidden bg-background focus-within:border-secondary-neon transition-colors">
                            <Input 
                                type="number" 
                                min="1" 
                                value={quantity} 
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="absolute inset-0 w-full h-full text-center text-lg font-bold bg-transparent border-none focus-visible:ring-0 px-0 z-10"
                            />
                            <div className="absolute inset-0 bg-secondary-neon/5 pointer-events-none" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-foreground/80">Delivery Spot</Label>
                        <Input 
                            placeholder="e.g. Block C, Room 404" 
                            className="h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-secondary-neon"
                            value={deliveryLocation}
                            onChange={(e) => setDeliveryLocation(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-foreground/80">Instructions</Label>
                    <Textarea 
                        placeholder="e.g. Extra spicy, don't ring bell..." 
                        className="min-h-[80px] rounded-xl bg-muted/30 border-border/50 resize-none focus-visible:ring-secondary-neon"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                <div className="py-2">
                    <AmbassadorDeliveryOption 
                        ambassadorDelivery={ambassadorDelivery}
                        setAmbassadorDelivery={setAmbassadorDelivery}
                        ambassadorMessage={ambassadorMessage}
                        setAmbassadorMessage={setAmbassadorMessage}
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold border-border/60 hover:bg-muted" onClick={onCancel}>
                        <X className="w-4 h-4 mr-2" /> Close
                    </Button>
                    <Button 
                        onClick={handleInitiatePayment} 
                        className="flex-[2] h-12 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-white font-black text-lg shadow-lg shadow-green-500/20"
                    >
                        Pay ₹{total}
                    </Button>
                </div>
            </>
        ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 pt-2">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800 text-center space-y-2">
                    <Wallet className="h-8 w-8 text-yellow-600 mx-auto mb-1" />
                    <h4 className="text-base font-bold text-yellow-800 dark:text-yellow-200">Payment Initiated</h4>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 leading-relaxed">
                        Manually transfer <strong>₹{total}</strong> using your UPI app and paste the UTR (Transaction ID) below.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Transaction ID (UTR)</Label>
                    <Input 
                        placeholder="e.g. 329104829102" 
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="h-12 text-center font-mono text-lg tracking-widest uppercase rounded-xl border-border/60 bg-muted/30 focus-visible:ring-secondary-neon"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setPaymentStep('initial')} disabled={isProcessing}>Back</Button>
                    <Button 
                        onClick={handleConfirmOrder} 
                        disabled={isProcessing || !transactionId} 
                        className="flex-[2] h-12 rounded-xl bg-secondary-neon text-primary-foreground font-bold hover:bg-secondary-neon/90"
                    >
                        {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm Order"}
                    </Button>
                </div>
            </div>
        )}
      </div>
    );
  }

  // --- RENDER: SELL / REQUEST MODE ---
  return (
    <form onSubmit={handlePostSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Dish Name {mode === 'request' && "(What do you want?)"}</Label>
        <Input placeholder="e.g. Chicken Biryani / Ginger Tea" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isProcessing} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Price (₹)</Label>
          <div className="relative">
             <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input type="number" placeholder="50" className="pl-8" value={price} onChange={(e) => setPrice(e.target.value)} disabled={isProcessing} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Prep Time</Label>
          <Select value={timeEstimate} onValueChange={setTimeEstimate} disabled={isProcessing}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10 min">10 min</SelectItem>
              <SelectItem value="20 min">20 min</SelectItem>
              <SelectItem value="30 min">30 min</SelectItem>
              <SelectItem value="1 hour">1 hour</SelectItem>
              <SelectItem value="Pre-order">Pre-order Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Dietary Type</Label>
        <RadioGroup value={dietaryType} onValueChange={setDietaryType} className="flex gap-4" disabled={isProcessing}>
          <div className="flex items-center space-x-2 border p-2 rounded-md w-full cursor-pointer hover:bg-green-50/50 border-green-200">
            <RadioGroupItem value="veg" id="veg" className="text-green-600 border-green-600" />
            <Label htmlFor="veg" className="text-green-700 font-bold cursor-pointer">Veg</Label>
          </div>
          <div className="flex items-center space-x-2 border p-2 rounded-md w-full cursor-pointer hover:bg-red-50/50 border-red-200">
            <RadioGroupItem value="non-veg" id="non-veg" className="text-red-600 border-red-600" />
            <Label htmlFor="non-veg" className="text-red-700 font-bold cursor-pointer">Non-Veg</Label>
          </div>
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label>Description & Ingredients</Label>
        <Textarea 
          placeholder="Describe the taste, ingredients, and portion size..." 
          className="h-20"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isProcessing}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={isProcessing}>Cancel</Button>
        <Button type="submit" className="flex-[2] bg-primary text-primary-foreground font-bold" disabled={isProcessing}>
           {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
           {mode === 'sell' ? 'List Dish' : 'Post Request'}
        </Button>
      </div>
    </form>
  );
};

export default PlaceFoodOrderForm;