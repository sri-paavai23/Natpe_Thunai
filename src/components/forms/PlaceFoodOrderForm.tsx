"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { FoodOffering } from "@/hooks/useFoodOfferings"; // Import FoodOffering type

// Define the form schema using Zod
const formSchema = z.object({
  quantity: z.coerce.number().min(1, "Quantity must be at least 1."),
  deliveryAddress: z.string().min(1, "Delivery address is required."),
  contactNumber: z.string().regex(/^\+?[1-9]\d{9,14}$/, "Invalid contact number format."),
  notes: z.string().optional(),
});

export type PlaceFoodOrderData = z.infer<typeof formSchema>;

interface PlaceFoodOrderFormProps {
  offering: FoodOffering; // Expect FoodOffering type
  onSubmit: (data: PlaceFoodOrderData) => Promise<void>;
  onCancel: () => void;
}

const PlaceFoodOrderForm: React.FC<PlaceFoodOrderFormProps> = ({ offering, onSubmit, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PlaceFoodOrderData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 1,
      deliveryAddress: "",
      contactNumber: "",
      notes: "",
    },
  });

  const unitPrice = offering.price; // Use price directly from FoodOffering

  const handleSubmit = async (data: PlaceFoodOrderData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
    } catch (error: any) {
      console.error("Error placing order:", error);
      toast.error(error.message || "Failed to place order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = unitPrice * form.watch("quantity");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>Offering: <span className="font-semibold text-foreground">{offering.title}</span></p>
          <p>Unit Price: <span className="font-semibold text-foreground">₹{unitPrice.toFixed(2)}</span></p>
        </div>
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Quantity</FormLabel>
              <FormControl>
                <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} disabled={isSubmitting} min="1" className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Input {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Input {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="text-lg font-bold text-foreground mt-4">
          Total: <span className="text-secondary-neon">₹{totalAmount.toFixed(2)}</span>
        </div>
        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><ShoppingBag className="mr-2 h-4 w-4" /> Place Order</>}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default PlaceFoodOrderForm;