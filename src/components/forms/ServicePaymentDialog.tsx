import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ServicePost } from '@/hooks/useServiceListings';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ServicePaymentDialogProps {
  service: ServicePost;
  onPaymentInitiated: (paymentDetails: { serviceId: string; amount: number; paymentMethod: string; ambassadorId?: string }) => void;
  onCancel: () => void;
}

const ServicePaymentDialog: React.FC<ServicePaymentDialogProps> = ({ service, onPaymentInitiated, onCancel }) => {
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to make a payment.");
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // If the service provider is an ambassador, increment their delivery count
      if (userProfile.isAmbassador && incrementAmbassadorDeliveriesCount) {
        await incrementAmbassadorDeliveriesCount();
      }

      onPaymentInitiated({
        serviceId: service.$id,
        amount: service.price,
        paymentMethod,
        ambassadorId: userProfile.isAmbassador ? user.$id : undefined,
      });
      toast.success("Payment initiated successfully!");
    } catch (error) {
      console.error("Payment failed:", error);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm Service Payment</DialogTitle>
          <DialogDescription>
            You are about to pay for "{service.title}".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label>Service:</Label>
            <span>{service.title}</span>
          </div>
          <div className="flex items-center justify-between">
            <Label>Price:</Label>
            <span className="font-semibold">₹{service.price.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <Label>Provider:</Label>
            <span>{service.providerName}</span>
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
          <Button onClick={handlePayment} disabled={isProcessing}>
            {isProcessing ? "Processing..." : `Pay ₹${service.price.toFixed(2)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ServicePaymentDialog;