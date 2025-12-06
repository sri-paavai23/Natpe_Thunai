"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ServicePost } from "@/hooks/useServiceListings";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { Loader2, DollarSign, Truck } from "lucide-react";
import { DEVELOPER_UPI_ID } from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption";
import { useNavigate } from "react-router-dom"; // NEW: Import useNavigate

interface BargainServiceDialogProps {
  service: ServicePost;
  onBargainInitiated: () => void;
  onCancel: () => void;
}

const BargainServiceDialog: React.FC<BargainServiceDialogProps> = ({ service, onBargainInitiated, onCancel }) => {
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth();
  const navigate = useNavigate(); // NEW: Initialize useNavigate
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false);
  const [ambassadorMessage, setAmbassadorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const discountRate = 0.15; // 15% fixed bargain discount

  // Parse original price
  const priceMatch = service.price.match(/₹(\d+(\.\d+)?)/);
  const originalPriceValue = priceMatch ? parseFloat(priceMatch[1]) : 0;
  const bargainedPrice = originalPriceValue * (1 - discountRate);

  const handleInitiateBargainPayment = async () => {
    // Added explicit check for user.$id
    if (!user || !user.$id || !userProfile || !userProfile.collegeName || !service) {
      toast.error("User session expired or profile incomplete. Please log in again and ensure your profile is complete.");
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);

    const transactionAmount = parseFloat(bargainedPrice.toFixed(2));
    const transactionNote = `Bargain for Service: ${service.title}`;

    try {
      // Create Appwrite Transaction Document (Status: initiated)
      const newTransaction = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          productId: service.$id, // Using service ID as product ID
          productTitle: service.title,
          buyerId: user.$id,
          buyerName: user.name,
          sellerId: service.posterId, // Service provider is the seller
          sellerName: service.posterName,
          sellerUpiId: userProfile.upiId, // Buyer's UPI ID for now, actual seller UPI is service.contact
          amount: transactionAmount,
          status: "initiated",
          type: "service", // Mark as service transaction
          isBargain: true,
          collegeName: userProfile.collegeName,
          ambassadorDelivery: ambassadorDelivery,
          ambassadorMessage: ambassadorMessage || null,
        }
      );

      const transactionId = newTransaction.$id;

      // Increment ambassador deliveries count if opted
      if (ambassadorDelivery) {
        await incrementAmbassadorDeliveriesCount();
      }

      // Generate UPI Deep Link (Payment goes to Developer UPI ID)
      const upiDeepLink = `upi://pay?pa=${DEVELOPER_UPI_ID}&pn=NatpeThunaiDevelopers&am=${transactionAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote + ` (TX ID: ${transactionId})`)}`;

      // Redirect to UPI App
      window.open(upiDeepLink, "_blank");

      toast.info(`Redirecting to UPI app to pay ₹${transactionAmount.toFixed(2)} to the developer. Please complete the payment and note the UTR ID.`);

      // Redirect to Confirmation Page (or tracking page)
      onBargainInitiated(); // Close dialog and trigger parent callback
      navigate(`/market/confirm-payment/${transactionId}`); // Navigate to a generic confirmation/tracking page

    } catch (error: any) {
      console.error("Error initiating bargain transaction for service:", error);
      toast.error(error.message || "Failed to initiate bargain transaction.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-3 py-2">
        <p className="text-sm text-foreground">Service: <span className="font-semibold">{service.title}</span></p>
        <p className="text-xl font-bold text-secondary-neon">
          Bargain Price: ₹{bargainedPrice.toFixed(2)}
        </p>
        <p className="text-xs text-green-500 flex items-center gap-1">
          <Badge variant="outline" className="bg-green-100 text-green-800">15% Bargain Applied</Badge>
        </p>
        <p className="text-xs text-muted-foreground">Provider: {service.posterName}</p>
        <p className="text-xs text-destructive-foreground">
          Payment will be made to Natpe Thunai Developers, who will then transfer the net amount to the service provider.
        </p>
      </div>

      <AmbassadorDeliveryOption
        ambassadorDelivery={ambassadorDelivery}
        setAmbassadorDelivery={setAmbassadorDelivery}
        ambassadorMessage={ambassadorMessage}
        setAmbassadorMessage={setAmbassadorMessage}
      />

      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isProcessing} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button onClick={handleInitiateBargainPayment} disabled={isProcessing} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Proceed to Payment"}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default BargainServiceDialog;