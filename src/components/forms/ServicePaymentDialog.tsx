"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { DEVELOPER_UPI_ID } from "@/lib/config";
import { useNavigate } from "react-router-dom";
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption";

// Infer ServicePost structure based on usage in other files
interface ServicePost {
  $id: string;
  title: string;
  description: string;
  category: string;
  price: string; // e.g., "₹500/hour", "Negotiable", "Free"
  contact: string; // Assuming this can be the UPI ID for services
  posterId: string;
  posterName: string;
  collegeName: string;
  isCustomOrder: boolean;
}

interface ServicePaymentDialogProps {
  service: ServicePost;
  onPaymentInitiated: () => void;
  onCancel: () => void;
}

// Helper function to parse the service price string into a number
const parseServicePrice = (priceString: string): number => {
  if (!priceString) return 0;
  const lowerCasePrice = priceString.toLowerCase();

  if (lowerCasePrice.includes("free") || lowerCasePrice.includes("negotiable")) {
    return 0;
  }

  // Extract numbers, handling various currency symbols and units
  const match = lowerCasePrice.match(/(\d+(\.\d+)?)/);
  if (match && match[1]) {
    return parseFloat(match[1]);
  }
  return 0; // Default to 0 if no valid number found
};

const ServicePaymentDialog: React.FC<ServicePaymentDialogProps> = ({ service, onPaymentInitiated, onCancel }) => {
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false);
  const [ambassadorMessage, setAmbassadorMessage] = useState("");

  const handleInitiatePayment = async () => {
    if (!user || !userProfile) {
      toast.error("Please log in to proceed with a transaction.");
      navigate("/auth");
      return;
    }
    if (!service) return;

    if (!service.posterId || service.posterId.trim() === "") {
      toast.error("Service provider information is missing or invalid. Cannot proceed with transaction.");
      console.error("Service provider ID is missing or empty for service:", service);
      return;
    }

    if (user.$id === service.posterId) {
      toast.error("You cannot pay for your own service listing.");
      return;
    }
    if (!userProfile.collegeName) {
      toast.error("Your profile is missing college information. Please update your profile first.");
      return;
    }

    setIsProcessing(true);

    // 1. Calculate Price using the robust parser
    const amount = parseServicePrice(service.price);

    if (isNaN(amount) || amount < 0) { // Amount can be 0 for free/negotiable
      toast.error("Invalid service price.");
      setIsProcessing(false);
      return;
    }

    const transactionAmount = parseFloat(amount.toFixed(2));
    const transactionNote = `Service payment for ${service.title}`;

    try {
      // 2. Create Appwrite Transaction Document (Status: initiated)
      const newTransaction = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          productId: service.$id, // Service ID
          productTitle: service.title, // Service Title
          buyerId: user.$id,
          buyerName: user.name,
          sellerId: service.posterId, // Service Provider ID
          sellerName: service.posterName, // Service Provider Name
          sellerUpiId: service.contact, // Assuming contact is UPI ID for services
          amount: transactionAmount,
          status: "initiated",
          type: "service", // Transaction type is 'service'
          isBargain: false, // Bargain handled separately for services
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

      // 3. Generate UPI Deep Link (Payment goes to Developer UPI ID)
      const upiDeepLink = `upi://pay?pa=${DEVELOPER_UPI_ID}&pn=NatpeThunaiDevelopers&am=${transactionAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote + ` (TX ID: ${transactionId})`)}`;

      // 4. Redirect to UPI App
      window.open(upiDeepLink, "_blank");
      
      toast.info(`Redirecting to UPI app to pay ₹${transactionAmount.toFixed(2)} to the developer. Please complete the payment and note the UTR ID.`);

      // 5. Redirect to Service Confirmation Page
      navigate(`/services/confirm-payment/${transactionId}`);
      onPaymentInitiated(); // Close the dialog

    } catch (error: any) {
      console.error("Error initiating service transaction:", error);
      toast.error(error.message || "Failed to initiate service transaction.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 py-2">
      <p className="text-sm text-foreground">Service: <span className="font-semibold">{service.title}</span></p>
      <p className="text-xl font-bold text-secondary-neon">
        Price: ₹{parseServicePrice(service.price).toFixed(2)}
      </p>
      <p className="text-xs text-muted-foreground">Provider: {service.posterName}</p>
      <p className="text-xs text-destructive-foreground">
          Recipient: Natpe Thunai Developers (UPI ID: {DEVELOPER_UPI_ID})
      </p>
      <p className="text-xs text-muted-foreground">
          You will be redirected to your UPI app. If redirection fails, please use the developer UPI ID/QR code found in the 'Chat with Developers' section of your profile.
      </p>

      <AmbassadorDeliveryOption
        ambassadorDelivery={ambassadorDelivery}
        setAmbassadorDelivery={setAmbassadorDelivery}
        ambassadorMessage={ambassadorMessage}
        setAmbassadorMessage={setAmbassadorMessage}
      />

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={isProcessing} className="border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button onClick={handleInitiatePayment} disabled={isProcessing} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Proceed to Payment"}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default ServicePaymentDialog;