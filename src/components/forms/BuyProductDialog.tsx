"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Product } from "@/lib/mockData";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from "@/lib/appwrite";
import { ID, Query } from 'appwrite';
import { Loader2, DollarSign, Truck } from "lucide-react";
import { DEVELOPER_UPI_ID } from "@/lib/config";
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption";
import { useNavigate } from "react-router-dom";

interface BuyProductDialogProps {
  product: Product;
  onPurchaseInitiated: () => void;
  onCancel: () => void;
}

const BuyProductDialog: React.FC<BuyProductDialogProps> = ({ product, onPurchaseInitiated, onCancel }) => {
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth();
  const navigate = useNavigate();
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false);
  const [ambassadorMessage, setAmbassadorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInitiatePurchasePayment = async () => {
    if (!user || !userProfile || !product) return;

    if (!product.userId) {
      toast.error("Seller information is missing. Cannot proceed with purchase.");
      return;
    }

    setIsProcessing(true);

    const transactionAmount = parseFloat(product.price.replace(/[^0-9.]/g, ''));
    const transactionNote = `Purchase of Product: ${product.title}`;

    try {
      // Check for existing initiated transaction for this product by this user
      const existingTransactions = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [
          Query.equal('productId', product.$id),
          Query.equal('buyerId', user.$id),
          Query.equal('status', 'initiated'), // Check for transactions that are still pending payment
          Query.limit(1)
        ]
      );

      if (existingTransactions.documents.length > 0) {
        toast.info("You already have an initiated payment for this product. Please complete it or wait for it to expire.");
        setIsProcessing(false);
        onPurchaseInitiated(); // Close dialog
        navigate(`/market/confirm-payment/${existingTransactions.documents[0].$id}`);
        return;
      }

      // Create Appwrite Transaction Document (Status: initiated)
      const newTransaction = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          productId: product.$id,
          productTitle: product.title,
          buyerId: user.$id,
          buyerName: user.name,
          sellerId: product.userId,
          sellerName: product.sellerName,
          sellerUpiId: product.sellerUpiId,
          amount: transactionAmount,
          status: "initiated",
          type: "product", // Mark as product transaction
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
      onPurchaseInitiated(); // Close dialog and trigger parent callback
      navigate(`/market/confirm-payment/${transactionId}`); // Navigate to a generic confirmation/tracking page

    } catch (error: any) {
      console.error("Error initiating purchase transaction:", error);
      toast.error(error.message || "Failed to initiate purchase transaction.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-3 py-2">
        <p className="font-bold text-red-500">Important: This is a non-Escrow payment system.</p>
        <p className="text-sm text-muted-foreground">You are about to place this order and will be redirected to your UPI app to complete the secure payment of the **full amount** to the developer's provided UPI ID. Natpe🤝Thunai developers will then transfer the net amount to the seller.</p>
      </div>
      <div className="space-y-3 py-2">
        <p className="text-sm text-foreground">Product: <span className="font-semibold">{product.title}</span></p>
        <p className="text-xl font-bold text-secondary-neon">
          Price: {product.price}
        </p>
        <p className="text-xs text-muted-foreground">Seller: {product.sellerName}</p>
        <p className="text-xs text-destructive-foreground">
          Payment will be made to Natpe Thunai Developers, who will then transfer the net amount to the seller.
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
        <Button onClick={handleInitiatePurchasePayment} disabled={isProcessing} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Proceed to Payment"}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default BuyProductDialog;