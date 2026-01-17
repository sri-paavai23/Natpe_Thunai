"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Plus, Minus, MapPin, IndianRupee, CheckCircle, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from "appwrite";
import { DEVELOPER_UPI_ID } from "@/lib/config";

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
  const [paymentStep, setPaymentStep] = useState<'initial' | 'verify'>('initial');
  const [transactionId, setTransactionId] = useState("");

  // SELL/REQUEST MODE STATE
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("homemade-meals");
  const [dietaryType, setDietaryType] = useState("veg");
  const [timeEstimate, setTimeEstimate] = useState("30 min");

  // --- BUY LOGIC (ORDERING) ---
  const handleInitiatePayment = () => {
    if (!user || !offering) return;
    
    if (!deliveryLocation.trim()) {
        toast.error("Please enter a delivery location (e.g., Room 304, Main Gate).");
        return;
    }

    const totalAmount = parseFloat(offering.price) * quantity;
    const note = `Food Order: ${offering.title} x${quantity}`;
    
    // Open UPI App
    const upiLink = `upi://pay?pa=${DEVELOPER_UPI_ID}&pn=NatpeThunaiEscrow&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
    window.open(upiLink, '_blank');
    
    toast.info("Opening UPI App... Please complete payment and return here.");
    setPaymentStep('verify');
  };

  const handleConfirmOrder = async () => {
    if (!user || !offering) return;
    if (!transactionId.trim()) {
        toast.error("Please enter the Transaction ID (UTR) from your UPI app.");
        return;
    }

    setIsProcessing(true);
    try {
        const totalAmount = parseFloat(offering.price) * quantity;

        await databases.createDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_FOOD_ORDERS_COLLECTION_ID,
            ID.unique(),
            {
                offeringId: offering.$id,
                offeringTitle: offering.title,
                providerId: offering.posterId,
                providerName: offering.posterName,
                buyerId: user.$id,
                buyerName: user.name,
                quantity: quantity,
                totalAmount: totalAmount,
                deliveryLocation: deliveryLocation,
                status: "Pending Confirmation", // Initial status
                transactionId: transactionId, // Store the UTR
                collegeName: userProfile?.collegeName
            }
        );

        toast.success("Order Placed! Waiting for chef confirmation.");
        if (onOrderPlaced) onOrderPlaced();

    } catch (error: any) {
        console.error("Order Error:", error);
        toast.error("Failed to place order. Please try again.");
    } finally {
        setIsProcessing(false);
    }
  };

  // --- SELL/REQUEST LOGIC (POSTING) ---
  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !description) {
      toast.error("Please fill all fields.");
      return;
    }
    
    const postData = {
      title,
      description,
      price, // Stored as string in ServicePost schema usually, but verify your schema
      category,
      dietaryType,
      timeEstimate,
      isCustomOrder: mode === "request",
      status: "active"
    };

    if (onSubmit) onSubmit(postData);
  };

  // --- RENDER: BUY MODE ---
  if (mode === "buy" && offering) {
    const total = (parseFloat(offering.price) * quantity).toFixed(0);

    return (
      <div className="space-y-4">
        {paymentStep === 'initial' ? (
            <>
                <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
                    <span className="font-bold text-sm">{offering.title}</span>
                    <span className="font-mono text-lg">₹{offering.price}</span>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>Quantity</Label>
                        <div className="flex items-center gap-3 bg-secondary/10 px-2 py-1 rounded-md">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus className="h-3 w-3" /></Button>
                            <span className="font-bold w-4 text-center">{quantity}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setQuantity(quantity + 1)}><Plus className="h-3 w-3" /></Button>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs">Delivery Location</Label>
                        <div className="relative">
                            <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Hostel Block A, Room 302..." 
                                className="pl-9"
                                value={deliveryLocation}
                                onChange={(e) => setDeliveryLocation(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-2 border-t border-dashed border-border mt-2">
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total to Pay:</span>
                        <span className="text-green-600">₹{total}</span>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleInitiatePayment} className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold">
                        <Wallet className="mr-2 h-4 w-4" /> Pay Now
                    </Button>
                </div>
            </>
        ) : (
            // PAYMENT VERIFICATION STEP
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 text-center">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">Payment Initiated</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Please enter the Transaction ID (UTR) from your UPI app to confirm.</p>
                </div>

                <div className="space-y-2">
                    <Label>Transaction ID (UTR)</Label>
                    <Input 
                        placeholder="e.g. 329104829102" 
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="font-mono text-center tracking-widest uppercase"
                    />
                </div>

                <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setPaymentStep('initial')}>Back</Button>
                    <Button onClick={handleConfirmOrder} disabled={isProcessing || !transactionId} className="flex-[2] bg-secondary-neon text-primary-foreground font-bold">
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="mr-2 h-4 w-4" /> Confirm Order</>}
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
        <Input placeholder="e.g. Chicken Biryani / Ginger Tea" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Price (₹)</Label>
          <div className="relative">
             <IndianRupee className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input type="number" placeholder="50" className="pl-8" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Prep Time</Label>
          <Select value={timeEstimate} onValueChange={setTimeEstimate}>
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
        <RadioGroup value={dietaryType} onValueChange={setDietaryType} className="flex gap-4">
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
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-[2] bg-primary text-primary-foreground font-bold">
           {mode === 'sell' ? 'List Dish' : 'Post Request'}
        </Button>
      </div>
    </form>
  );
};

export default PlaceFoodOrderForm;