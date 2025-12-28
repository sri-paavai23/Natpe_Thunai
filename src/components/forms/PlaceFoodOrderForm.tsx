import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FoodOffering } from '@/hooks/useCanteenData'; // Assuming FoodOffering exists
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface PlaceFoodOrderFormProps {
  offering: FoodOffering;
  onOrderPlaced: (orderData: { offeringId: string; quantity: number; totalPrice: number; deliveryLocation: string; contactNumber: string; notes?: string }) => void;
  onCancel: () => void;
}

const PlaceFoodOrderForm: React.FC<PlaceFoodOrderFormProps> = ({ offering, onOrderPlaced, onCancel }) => {
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth(); // NEW: Get incrementAmbassadorDeliveriesCount
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [deliveryLocation, setDeliveryLocation] = useState(userProfile?.collegeName || "");
  const [contactNumber, setContactNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPrice = offering.price * quantity;

  const handleSubmit = async () => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to place an order.");
      navigate('/login');
      return;
    }
    if (!deliveryLocation || !contactNumber) {
      toast.error("Please fill in delivery location and contact number.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate order placement
      await new Promise(resolve => setTimeout(resolve, 1500));

      // If the offering is from an ambassador, increment their delivery count
      // This logic might need to be more sophisticated if offerings aren't directly tied to ambassadors
      // For now, assuming if the user placing the order is an ambassador, it counts as their delivery
      if (userProfile.isAmbassador && incrementAmbassadorDeliveriesCount) {
        await incrementAmbassadorDeliveriesCount();
      }

      onOrderPlaced({
        offeringId: offering.$id,
        quantity,
        totalPrice,
        deliveryLocation,
        contactNumber,
        notes: notes || undefined,
      });
      toast.success("Order placed successfully!");
    } catch (error) {
      console.error("Order placement failed:", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Place Order for {offering.name}</DialogTitle>
          <DialogDescription>
            Confirm your order details and delivery information.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label>Item:</Label>
            <span>{offering.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="quantity">Quantity:</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-24"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label>Unit Price:</Label>
            <span>₹{offering.price.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between font-semibold text-lg">
            <Label>Total Price:</Label>
            <span>₹{totalPrice.toFixed(2)}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryLocation">Delivery Location</Label>
            <Input
              id="deliveryLocation"
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
              placeholder="e.g., Hostel Block A, Room 101"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input
              id="contactNumber"
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="e.g., +91 9876543210"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific instructions for delivery..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Placing Order..." : "Place Order"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlaceFoodOrderForm;