import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Product } from '@/hooks/useMarketListings'; // Assuming Product interface exists
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface BuyProductDialogProps {
  product: Product;
  onPurchaseInitiated: (purchaseDetails: { productId: string; amount: number; paymentMethod: string; ambassadorId?: string }) => void;
  onCancel: () => void;
}

const BuyProductDialog: React.FC<BuyProductDialogProps> = ({ product, onPurchaseInitiated, onCancel }) => {
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to make a purchase.");
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // If the seller is an ambassador, increment their delivery count
      // This logic assumes product.sellerId can be used to check if seller is an ambassador
      // In a real app, you'd fetch seller's profile to confirm if they are an ambassador
      if (userProfile.isAmbassador && incrementAmbassadorDeliveriesCount) { // Simplified: assuming current user is the ambassador for this transaction
        await incrementAmbassadorDeliveriesCount();
      }

      onPurchaseInitiated({
        productId: product.$id,
        amount: product.price,
        paymentMethod,
        ambassadorId: userProfile.isAmbassador ? user.$id : undefined, // Pass ambassador ID if current user is ambassador
      });
      toast.success("Purchase initiated successfully!");
    } catch (error) {
      console.error("Purchase failed:", error);
      toast.error("Purchase failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Purchase</DialogTitle>
          <DialogDescription>
            You are about to purchase "{product.title}".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label>Product:</Label>
            <span>{product.title}</span>
          </div>
          <div className="flex items-center justify-between">
            <Label>Price:</Label>
            <span className="font-semibold">₹{product.price.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <Label>Seller:</Label>
            <span>{product.sellerName}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="wallet" id="wallet" />
                <Label htmlFor="wallet">Campus Wallet</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upi" id="upi" disabled />
                <Label htmlFor="upi">UPI (Coming Soon)</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handlePurchase} disabled={isProcessing}>
            {isProcessing ? "Processing..." : `Buy for ₹${product.price.toFixed(2)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BuyProductDialog;