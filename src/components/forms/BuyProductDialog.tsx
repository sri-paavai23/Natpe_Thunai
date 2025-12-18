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
import { MarketListing } from "@/hooks/useMarketListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";

const formSchema = z.object({
  quantity: z.number().min(1, { message: "Quantity must be at least 1." }).optional(),
  message: z.string().optional(),
  deliveryAddress: z.string().min(5, { message: "Delivery address is required." }),
  contactNumber: z.string().min(10, { message: "Contact number is required." }),
  utrId: z.string().optional(),
});

interface BuyProductDialogProps {
  product: MarketListing;
  onClose: () => void;
}

const BuyProductDialog: React.FC<BuyProductDialogProps> = ({ product, onClose }) => {
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const priceMatch = product.price.match(/₹(\d+(\.\d+)?)/);
  const unitPrice = priceMatch ? parseFloat(priceMatch[1]) : 0;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: product.type === "sell" || product.type === "rent" ? 1 : undefined,
      message: "",
      deliveryAddress: userProfile?.hostelRoom || "",
      contactNumber: userProfile?.phone || "",
      utrId: "",
    },
  });

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to proceed.");
      return;
    }

    setIsSubmitting(true);
    try {
      const transactionAmount = (data.quantity ?? 1) * unitPrice;

      if (product.type !== "gift") {
        if (!product.contact) {
          toast.error("Seller contact (UPI ID) is missing.");
          return;
        }
        const upiDeepLink = `upi://pay?pa=${product.contact}&pn=${encodeURIComponent(product.posterName)}&am=${transactionAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`${product.type === "sell" ? "Purchase" : "Rent"} for ${product.title}`)}`;
        window.open(upiDeepLink, "_blank");
        toast.info(`Redirecting to UPI app to pay ₹${transactionAmount.toFixed(2)} to ${product.posterName}. Please enter UTR ID below after payment.`);
      }

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          productId: product.$id,
          productTitle: product.title,
          buyerId: user.$id,
          buyerName: user.name,
          sellerId: product.posterId,
          sellerName: product.posterName,
          sellerUpiId: product.contact,
          amount: transactionAmount,
          status: product.type === "gift" ? "completed" : "initiated",
          type: product.type,
          quantity: data.quantity,
          message: data.message,
          deliveryAddress: data.deliveryAddress,
          contactNumber: data.contactNumber,
          collegeName: userProfile.collegeName,
          ambassadorDelivery: product.ambassadorDelivery,
          ambassadorMessage: product.ambassadorMessage,
          utrId: data.utrId,
        }
      );

      if (product.ambassadorDelivery) {
        await incrementAmbassadorDeliveriesCount();
      }

      toast.success(`${product.type === "gift" ? "Item claimed" : "Transaction initiated"} successfully!`);
      onClose();
    } catch (error: any) {
      console.error("Error processing transaction:", error);
      toast.error(error.message || "Failed to process transaction.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const watchQuantity = form.watch("quantity") ?? 1;
  const calculatedTotalPrice = unitPrice * watchQuantity;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {product.type === "sell" ? "Buying" : product.type === "rent" ? "Renting" : "Getting"}:{" "}
          <span className="font-semibold text-foreground">{product.title}</span>
        </p>
        {product.type !== "gift" && (
          <p className="text-xs text-muted-foreground">Price: <span className="font-medium text-secondary-neon">{product.price}</span></p>
        )}
        <p className="text-xs text-muted-foreground">Seller: {product.posterName}</p>

        {(product.type === "sell" || product.type === "rent") && (
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
        )}
        {(product.type === "sell" || product.type === "rent") && (
          <p className="text-sm text-muted-foreground">Total Price: <span className="font-bold text-secondary-neon">₹{calculatedTotalPrice.toFixed(2)}</span></p>
        )}

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Message to Seller (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., 'When can I pick it up?', 'Any specific delivery instructions?'" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
              <FormLabel className="text-foreground">Delivery/Pickup Address</FormLabel>
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
              <FormLabel className="text-foreground">Your Contact Number</FormLabel>
              <FormControl>
                <Input type="tel" placeholder="e.g., 9876543210" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {product.type !== "gift" && (
          <FormField
            control={form.control}
            name="utrId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">UPI Transaction ID (UTR) (Required for payment confirmation)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter UTR ID after payment" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (product.type === "sell" ? "Confirm Purchase" : product.type === "rent" ? "Confirm Rent" : "Confirm Claim")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default BuyProductDialog;