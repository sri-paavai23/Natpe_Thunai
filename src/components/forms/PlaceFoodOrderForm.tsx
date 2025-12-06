"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ServicePost } from "@/hooks/useServiceListings";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { Loader2, DollarSign, Truck } from "lucide-react";
import { DEVELOPER_UPI_ID } from "@/lib/config"; // Import DEVELOPER_UPI_ID
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"; // Import Dialog components
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption"; // NEW: Import AmbassadorDeliveryOption

interface PlaceFoodOrderFormProps {
  offering: ServicePost;
  onOrderPlaced: () => void;
  onCancel: () => void;
}

const PlaceFoodOrderForm: React.FC<PlaceFoodOrderFormProps> = ({ offering, onOrderPlaced, onCancel }) => {
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth(); // NEW: Get incrementAmbassadorDeliveriesCount
  const [quantity, setQuantity] = useState(1);
  const [deliveryLocation, setDeliveryLocation] = useState(userProfile?.mobileNumber || ""); // Using mobile number field for location placeholder
  const [notes, setNotes] = useState("");
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false); // NEW
  const [ambassadorMessage, setAmbassadorMessage] = useState(""); // NEW
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Simple price parsing (assuming price is like "₹150" or "₹500/hour")
  const priceMatch = offering.price.match(/₹(\d+(\.\d+)?)/);
  const unitPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;
  const totalAmount = unitPrice * quantity;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) {
      toast.error("You must be logged in to place an order.");
      return;
    }
    if (!userProfile.collegeName) {
      toast.error("Your profile is missing college information. Please update your profile first.");
      return;
    }
    if (quantity <= 0 || !deliveryLocation.trim()) {
      toast.error("Please specify a valid quantity and delivery location.");
      return;
    }
    if (totalAmount <= 0) {
        toast.error("Invalid price or quantity.");
        return;
    }
    setIsConfirming(true);
  };

  const handlePaymentInitiation = async () => {
    setIsConfirming(false);
    setIsSubmitting(true);

    if (!user || !userProfile) return;

    const orderTitle = `${offering.title} x${quantity}`;
    const transactionNote = `Food Order: ${orderTitle}`;

    try {
      // 1. Create Appwrite Food Order Document (Status: payment_initiated)
      // We use the Food Order collection directly for tracking this transaction type
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
          quantity: quantity,
          totalAmount: totalAmount,
          deliveryLocation: deliveryLocation.trim(),
          notes: notes.trim(),
          status: "Pending Confirmation", // We keep this status for the provider flow, but payment is initiated now.
          collegeName: userProfile.collegeName, // NEW: Add collegeName
          ambassadorDelivery: ambassadorDelivery, // NEW
          ambassadorMessage: ambassadorMessage || null, // NEW
        }
      );
      
      const orderId = newOrder.$id;

      // NEW: Increment ambassador deliveries count if opted
      if (ambassadorDelivery) {
        await incrementAmbassadorDeliveriesCount();
      }

      // 2. Generate UPI Deep Link (Payment goes to Developer UPI ID)
      const upiDeepLink = `upi://pay?pa=${DEVELOPER_UPI_ID}&pn=NatpeThunaiDevelopers&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote + ` (Order ID: ${orderId})`)}`;

      // 3. Redirect to UPI App
      window.open(upiDeepLink, "_blank");
      
      toast.info(`Redirecting to UPI app to pay ₹${totalAmount.toFixed(2)} to the developer. Please complete the payment and note the UTR ID.`);

      // 4. Redirect to a confirmation page (or just close the modal and let user track it)
      // Since we don't have a dedicated Food Order confirmation page, we rely on the TrackingPage.
      onOrderPlaced();

    } catch (e: any) {
      console.error("Error placing food order:", e);
      toast.error(e.message || "Failed to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleFormSubmit} className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="quantity" className="text-foreground">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            min="1"
            className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deliveryLocation" className="text-foreground">Delivery Location (Hostel/Room/Block)</Label>
          <Input
            id="deliveryLocation"
            type="text"
            value={deliveryLocation}
            onChange={(e) => setDeliveryLocation(e.target.value)}
            placeholder="e.g., Block C, Room 404"
            className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-foreground">Special Notes (Optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Make it spicy, deliver after 7 PM."
            className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
            disabled={isSubmitting}
          />
        </div>

        <AmbassadorDeliveryOption // NEW
          ambassadorDelivery={ambassadorDelivery}
          setAmbassadorDelivery={setAmbassadorDelivery}
          ambassadorMessage={ambassadorMessage}
          setAmbassadorMessage={setAmbassadorMessage}
        />

        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Proceed to Payment"}
          </Button>
        </DialogFooter>
      </form>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-secondary-neon" /> Confirm Payment
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              You are about to pay the total amount to the developer to secure your order.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-foreground">Item: <span className="font-semibold">{offering.title} x{quantity}</span></p>
            <p className="text-xl font-bold text-secondary-neon">Total Amount: ₹{totalAmount.toFixed(2)}</p>
            {ambassadorDelivery && ( // NEW
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Truck className="h-4 w-4" /> Ambassador Delivery Requested
                {ambassadorMessage && <span className="ml-1">({ambassadorMessage})</span>}
              </p>
            )}
            <p className="text-xs text-destructive-foreground">
                Recipient: Natpe Thunai Developers (UPI ID: {DEVELOPER_UPI_ID})
            </p>
            <p className="text-xs text-muted-foreground">
                You will be redirected to your UPI app. If redirection fails, please use the developer UPI ID/QR code found in the 'Chat with Developers' section of your profile.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirming(false)} className="border-border text-primary-foreground hover:bg-muted">
              Go Back
            </Button>
            <Button onClick={handlePaymentInitiation} disabled={isSubmitting} className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Pay Now & Place Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PlaceFoodOrderForm;