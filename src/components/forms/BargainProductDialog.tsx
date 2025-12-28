import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Product } from '@/hooks/useMarketListings';
import { toast } from 'sonner';

interface BargainProductDialogProps {
  product: Product;
  onBargainInitiated: (bargainDetails: { productId: string; requestedPrice: number; message: string }) => void;
  onCancel: () => void;
}

const BargainProductDialog: React.FC<BargainProductDialogProps> = ({ product, onBargainInitiated, onCancel }) => {
  const [requestedPrice, setRequestedPrice] = useState<number>(product.price * 0.8); // Default to 80% of original
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBargain = async () => {
    if (requestedPrice <= 0 || requestedPrice >= product.price) {
      toast.error("Requested price must be greater than 0 and less than the original price.");
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate bargain request submission
      await new Promise(resolve => setTimeout(resolve, 1500));

      onBargainInitiated({
        productId: product.$id,
        requestedPrice,
        message,
      });
      // toast.success("Bargain request sent successfully!"); // Toast handled by parent
    } catch (error) {
      console.error("Bargain request failed:", error);
      toast.error("Failed to send bargain request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Initiate Bargain for "{product.title}"</DialogTitle>
          <DialogDescription>
            Propose a new price for the product.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label>Original Price:</Label>
            <span className="font-semibold">₹{product.price.toFixed(2)}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="requestedPrice">Your Proposed Price (₹)</Label>
            <Input
              id="requestedPrice"
              type="number"
              value={requestedPrice}
              onChange={(e) => setRequestedPrice(parseFloat(e.target.value))}
              min={1}
              max={product.price - 1}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., 'I'm a student on a tight budget.'"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleBargain} disabled={isProcessing}>
            {isProcessing ? "Sending..." : `Propose ₹${requestedPrice.toFixed(2)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BargainProductDialog;