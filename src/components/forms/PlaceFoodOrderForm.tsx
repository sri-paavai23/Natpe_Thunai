"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ServicePost } from "@/hooks/useServiceListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";

const formSchema = z.object({
  quantity: z.number().min(1, { message: "Quantity must be at least 1." }),
  specialInstructions: z.string().optional(),
  deliveryAddress: z.string().min(5, { message: "Delivery address is required." }),
  contactNumber: z.string().min(10, { message: "Contact number is required." }),
});

interface PlaceFoodOrderFormProps {
  offering: ServicePost;
  onClose: () => void;
}

const PlaceFoodOrderForm: React.FC<PlaceFoodOrderFormProps> = ({ offering, onClose }) => {
  const { user, userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simple price parsing (assuming price is like "₹150" or "₹500/hour")
  const priceMatch = offering.price.match(/₹(\d+(\.\d+)?)/);
  const unitPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      specialInstructions: "",
      deliveryAddress: userProfile?.hostelRoom || "", // Pre-fill if available
      contactNumber: userProfile?.phone || "", // Pre-fill if available
    },
  });

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to place an order.");
      return;
    }

    setIsSubmitting(true);
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        ID.unique(),
        {
          offeringId: offering.$id,
          offeringTitle: offering.title,
          providerId: offering.providerId, // Corrected from posterId
          providerName: offering.providerName, // Corrected from posterName
          buyerId: user.$id,
          buyerName: user.name,
          quantity: data.quantity,
          unitPrice: offering.price, // Store original price string
          totalPrice: `₹${(unitPrice * data.quantity).toFixed(2)}`,
          specialInstructions: data.specialInstructions,
          deliveryAddress: data.deliveryAddress,
          contactNumber: data.contactNumber,
          status: "pending",
          collegeName: userProfile.collegeName,
        }
      );
      toast.success("Food order placed successfully!");
      onClose();
    } catch (error: any) {
      console.error("Error placing food order:", error);
      toast.error(error.message || "Failed to place food order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchQuantity = form.watch("quantity");
  const calculatedTotalPrice = unitPrice * watchQuantity;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Ordering: <span className="font-semibold text-foreground">{offering.title}</span>
        </p>
        <p className="text-xs text-muted-foreground">Price per unit: <span className="font-medium text-secondary-neon">{offering.price}</span></p>
        <p className="text-xs text-muted-foreground">Provider: {offering.providerName}</p> {/* Corrected from posterName */}

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Quantity</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <p className="text-sm text-muted-foreground">Total Price: <span className="font-bold text-secondary-neon">₹{calculatedTotalPrice.toFixed(2)}</span></p>

        <FormField
          control={form.control}
          name="specialInstructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Special Instructions (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., 'Less spicy', 'No onions'" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="deliveryAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Delivery Address</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Hostel Block A, Room 101" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Contact Number</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="e.g., 9876543210" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Place Order"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default PlaceFoodOrderForm;