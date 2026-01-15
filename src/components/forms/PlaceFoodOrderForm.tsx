"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DialogFooter } from "@/components/ui/dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  Loader2, Utensils, MapPin, IndianRupee, Leaf, Beef, 
  Truck, DollarSign, AlertTriangle, Phone, X 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { DEVELOPER_UPI_ID } from "@/lib/config";

export interface PlaceFoodOrderFormProps {
  mode: "buy" | "sell" | "request"; 
  offering?: any; 
  onSubmit?: (data: any) => void; 
  onCancel: () => void;
  onOrderPlaced?: () => void; 
}

const PlaceFoodOrderForm: React.FC<PlaceFoodOrderFormProps> = ({ 
  mode, 
  offering, 
  onSubmit, 
  onCancel,
  onOrderPlaced 
}) => {
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // --- STATE: SELL / REQUEST MODE ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("homemade-meals");
  const [dietaryType, setDietaryType] = useState("veg");
  const [meetingSpot, setMeetingSpot] = useState(""); // Formerly timeEstimate
  const [contact, setContact] = useState(userProfile?.mobileNumber || ""); // NEW: Contact Field

  // --- STATE: BUY MODE ---
  const [quantity, setQuantity] = useState(1);
  const [deliveryLocation, setDeliveryLocation] = useState(userProfile?.mobileNumber || ""); 
  const [notes, setNotes] = useState("");
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false);
  const [ambassadorMessage, setAmbassadorMessage] = useState("");
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);

  // --- LOGIC: SUBMIT LISTING (Sell/Request) ---
  const handleListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || !price || !meetingSpot || !contact) {
      toast.error("Please fill in all details including contact info.");
      return;
    }
    
    setLoading(true);
    const data = {
      title,
      description,
      price: `₹${price}`,
      category,
      dietaryType,
      contact, // Added Contact Attribute
      timeEstimate: meetingSpot, // Mapping Meeting Spot to timeEstimate attribute for schema compatibility
      isCustomOrder: mode === 'request',
      status: "Active"
    };

    if (onSubmit) await onSubmit(data);
    setLoading(false);
  };

  // --- LOGIC: BUY ITEM (Payment Flow) ---
  const handleBuySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) { toast.error("Login required."); return; }
    if (quantity <= 0 || !deliveryLocation.trim()) { toast.error("Invalid details."); return; }
    setIsConfirmingPayment(true);
  };

  const handlePaymentInitiation = async () => {
    if (!offering || !user || !userProfile) return;
    setIsConfirmingPayment(false);
    setLoading(true);

    const priceMatch = offering.price.match(/₹(\d+(\.\d+)?)/);
    const unitPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;
    const totalAmount = unitPrice * quantity;
    const orderTitle = `${offering.title} x${quantity}`;

    try {
      const newOrder = await databases.createDocument(
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
          quantity,
          totalAmount,
          deliveryLocation: deliveryLocation.trim(),
          notes: notes.trim(),
          status: "Pending Confirmation",
          collegeName: userProfile.collegeName,
          ambassadorDelivery,
          ambassadorMessage: ambassadorMessage || null,
        }
      );

      if (ambassadorDelivery && incrementAmbassadorDeliveriesCount) {
        await incrementAmbassadorDeliveriesCount();
      }

      const targetUPI = DEVELOPER_UPI_ID || "example@upi"; 
      const upiDeepLink = `upi://pay?pa=${targetUPI}&pn=NatpeThunai&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Food: ${orderTitle} #${newOrder.$id.substring(0,6)}`)}`;
      window.open(upiDeepLink, "_blank");
      
      toast.success("Order Placed! Please complete payment.");
      if (onOrderPlaced) onOrderPlaced();

    } catch (e: any) {
      toast.error(e.message || "Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER: SELL / REQUEST FORM ---
  if (mode === 'sell' || mode === 'request') {
    return (
      <form onSubmit={handleListingSubmit} className="space-y-4 py-1 h-full flex flex-col">
        
        {/* Scrollable Content Area */}
        <div className="flex-1 space-y-4 overflow-y-auto px-1">
            <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                <SelectItem value="homemade-meals">Homemade Meal</SelectItem>
                <SelectItem value="wellness-remedies">Home Remedy</SelectItem>
                <SelectItem value="snacks">Snacks</SelectItem>
                </SelectContent>
            </Select>
            </div>

            <div className="space-y-1.5">
            <Label htmlFor="title">{mode === 'request' ? "What are you craving?" : "Dish Name"}</Label>
            <div className="relative">
                <Utensils className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="title" placeholder={mode === 'request' ? "e.g. Spicy Paneer Roll" : "e.g. Chicken Biryani"} className="pl-9 h-11" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            </div>

            <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase text-muted-foreground">Type</Label>
            <RadioGroup defaultValue="veg" value={dietaryType} onValueChange={setDietaryType} className="flex gap-3">
                <div className={`flex-1 flex items-center justify-center space-x-2 border p-3 rounded-lg cursor-pointer transition-all ${dietaryType === 'veg' ? 'bg-green-50 border-green-500 ring-1 ring-green-500' : 'border-border bg-card'}`}>
                    <RadioGroupItem value="veg" id="veg" className="text-green-600 border-green-600" />
                    <Label htmlFor="veg" className="flex items-center gap-1 cursor-pointer text-green-700 font-medium">
                        <Leaf className="h-3 w-3" /> Veg
                    </Label>
                </div>
                <div className={`flex-1 flex items-center justify-center space-x-2 border p-3 rounded-lg cursor-pointer transition-all ${dietaryType === 'non-veg' ? 'bg-red-50 border-red-500 ring-1 ring-red-500' : 'border-border bg-card'}`}>
                    <RadioGroupItem value="non-veg" id="non-veg" className="text-red-600 border-red-600" />
                    <Label htmlFor="non-veg" className="flex items-center gap-1 cursor-pointer text-red-700 font-medium">
                        <Beef className="h-3 w-3" /> Non-Veg
                    </Label>
                </div>
            </RadioGroup>
            </div>

            <div className="space-y-1.5">
            <Label htmlFor="desc">{mode === 'request' ? "Preferences" : "Description"}</Label>
            <Textarea id="desc" placeholder="Ingredients, spiciness level, portion size..." className="h-20 resize-none text-sm" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
                <Label htmlFor="price">{mode === 'request' ? "Budget (₹)" : "Price (₹)"}</Label>
                <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="price" type="number" placeholder="120" className="pl-9 h-11" value={price} onChange={(e) => setPrice(e.target.value)} />
                </div>
            </div>
            {/* NEW CONTACT FIELD */}
            <div className="space-y-1.5">
                <Label htmlFor="contact">Contact</Label>
                <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="contact" placeholder="Mobile / Insta" className="pl-9 h-11" value={contact} onChange={(e) => setContact(e.target.value)} />
                </div>
            </div>
            </div>

            {/* RENAMED & REPURPOSED FIELD: Prep Time -> Meeting Spot */}
            <div className="space-y-1.5">
                <Label htmlFor="spot">{mode === 'request' ? "Delivery Point" : "Collection Point & Time"}</Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                        id="spot" 
                        placeholder={mode === 'request' ? "e.g. Block A Lobby @ 1PM" : "e.g. Main Canteen @ 1:30 PM"} 
                        className="pl-9 h-11" 
                        value={meetingSpot} 
                        onChange={(e) => setMeetingSpot(e.target.value)} 
                    />
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-2 mt-auto border-t border-border/50">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="flex-1 h-11 border-muted-foreground/20">
             <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
          <Button type="submit" className="flex-[2] bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 h-11 text-base font-semibold shadow-md" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (mode === 'request' ? "Post Request" : "List Item")}
          </Button>
        </div>
      </form>
    );
  }

  // --- RENDER: BUY FORM ---
  return (
    <>
      <form onSubmit={handleBuySubmit} className="grid gap-4 py-2">
        <Alert variant="destructive" className="py-2 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-xs font-bold text-red-700 dark:text-red-400">No Cancellation</AlertTitle>
          <AlertDescription className="text-[10px] text-red-600/80">Orders cannot be cancelled once preparation starts.</AlertDescription>
        </Alert>

        <div className="grid grid-cols-4 gap-3">
            <div className="col-span-1 space-y-1.5">
                <Label htmlFor="quantity">Qty</Label>
                <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} min="1" className="text-center h-11" required />
            </div>
            <div className="col-span-3 space-y-1.5">
                <Label htmlFor="location">Delivery Spot</Label>
                <Input id="location" value={deliveryLocation} onChange={(e) => setDeliveryLocation(e.target.value)} placeholder="e.g. Block C, Room 404" className="h-11" required />
            </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Instructions</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Extra spicy, don't ring bell..." className="h-20 resize-none text-sm" />
        </div>

        <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-secondary-neon" />
                    <Label htmlFor="ambassador-mode" className="font-semibold cursor-pointer text-sm">Ambassador Delivery</Label>
                </div>
                <Switch id="ambassador-mode" checked={ambassadorDelivery} onCheckedChange={setAmbassadorDelivery} />
            </div>
            {ambassadorDelivery && (
                 <Input placeholder="Msg for runner (e.g. Call when near)" value={ambassadorMessage} onChange={(e) => setAmbassadorMessage(e.target.value)} className="text-xs h-9" />
            )}
        </div>

        <div className="flex gap-3 pt-2 mt-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="flex-1 h-11">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="flex-[2] bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 h-11 text-base font-bold shadow-md">
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : `Pay ₹${offering ? (parseFloat(offering.price.match(/₹(\d+(\.\d+)?)/)?.[1] || '0') * quantity).toFixed(0) : '0'}`}
          </Button>
        </div>
      </form>

      <Dialog open={isConfirmingPayment} onOpenChange={setIsConfirmingPayment}>
        <DialogContent className="sm:max-w-[425px] w-[95%] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-secondary-neon" /> Confirm Payment
            </DialogTitle>
            <DialogDescription className="text-xs">You will be redirected to your UPI app to complete the transfer.</DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm space-y-3 bg-muted/30 p-4 rounded-lg">
             <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Item</span>
                <span className="font-semibold text-foreground">{offering?.title} <span className="text-xs text-muted-foreground">x{quantity}</span></span>
             </div>
             <div className="flex justify-between items-center pt-3 border-t border-border">
                <span className="font-bold">Total Amount</span>
                <span className="font-black text-xl text-secondary-neon">₹{(parseFloat(offering?.price?.match(/₹(\d+(\.\d+)?)/)?.[1] || '0') * quantity).toFixed(0)}</span>
             </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsConfirmingPayment(false)} className="flex-1">Back</Button>
            <Button onClick={handlePaymentInitiation} className="flex-1 bg-secondary-neon text-primary-foreground">Pay Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlaceFoodOrderForm;