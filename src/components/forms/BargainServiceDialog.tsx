"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { ServicePost } from "@/hooks/useServiceListings"; // Import ServicePost
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from "appwrite";

interface BargainServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServicePost; // Use ServicePost type
}

const BargainServiceDialog: React.FC<BargainServiceDialogProps> = ({ isOpen, onClose, service }) => {
  const { user, userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bargainAmount, setBargainAmount] = useState<string>("");

  // Parse original price
  const priceMatch = service.price.match(/₹(\d+(\.\d+)?)/);
  const originalPriceValue = priceMatch ? parseFloat(priceMatch[1]) : 0;

  const handleSendBargainRequest = async () => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to send a bargain request.");
      return;
    }
    if (user.$id === service.posterId) {
      toast.error("You cannot bargain on your own service.");
      return;
    }

    const requestedAmount = parseFloat(bargainAmount);
    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      toast.error("Please enter a valid bargain amount.");
      return;
    }
    if (requestedAmount >= originalPriceValue) {
      toast.error("Bargain amount must be less than the original price.");
      return;
    }

    setIsSubmitting(true);
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID,
        ID.unique(),
        {
          itemId: service.$id,
          itemType: "service",
          itemTitle: service.title,
          sellerId: service.posterId,
          sellerName: service.posterName,
          buyerId: user.$id,
          buyerName: user.name,
          originalPrice: originalPriceValue,
          requestedPrice: requestedAmount,
          status: "pending",
          collegeName: userProfile.collegeName,
        }
      );
      toast.success("Bargain request sent successfully!");
      onClose();
    } catch (error: any) {
      console.error("Error sending bargain request:", error);
      toast.error(error.message || "Failed to send bargain request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <MessageSquareText className="h-5 w-5 text-secondary-neon" /> Send Bargain Request
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Request a lower price for "{service.title}".
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-foreground">Original Price: <span className="font-semibold text-secondary-neon">₹{originalPriceValue.toFixed(2)}</span></p>
          <div>
            <Label htmlFor="bargain-amount" className="text-foreground">Your Proposed Amount (₹)</Label>
            <Input
              id="bargain-amount"
              type="number"
              value={bargainAmount}
              onChange={(e) => setBargainAmount(e.target.value)}
              placeholder="e.g., 1200"
              disabled={isSubmitting}
              className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="border-border text-primary-foreground hover:bg-muted">
            Cancel
          </Button>
          <Button onClick={handleSendBargainRequest} disabled={isSubmitting || !bargainAmount} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BargainServiceDialog;