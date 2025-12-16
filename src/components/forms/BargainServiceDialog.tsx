"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ServicePost } from "@/hooks/useServiceListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from "appwrite";
import { useAuth } from "@/context/AuthContext";

const formSchema = z.object({
  bargainPrice: z.string().min(1, { message: "Bargain price is required." }),
  message: z.string().optional(),
});

interface BargainServiceDialogProps {
  service: ServicePost;
  onClose: () => void;
}

const BargainServiceDialog: React.FC<BargainServiceDialogProps> = ({ service, onClose }) => {
  const { user, userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse original price
  const priceMatch = service.price.match(/₹(\d+(\.\d+)?)/);
  const originalPriceValue = priceMatch ? parseFloat(priceMatch[1]) : 0;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bargainPrice: "",
      message: "",
    },
  });

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to bargain.");
      return;
    }

    const bargainPriceValue = parseFloat(data.bargainPrice.replace(/₹/, ''));
    if (isNaN(bargainPriceValue) || bargainPriceValue <= 0) {
      form.setError("bargainPrice", { message: "Please enter a valid bargain price." });
      return;
    }
    if (bargainPriceValue > originalPriceValue) {
      form.setError("bargainPrice", { message: "Bargain price cannot be higher than the original price." });
      return;
    }

    setIsSubmitting(true);
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_BARGAIN_REQUESTS_COLLECTION_ID,
        ID.unique(),
        {
          serviceId: service.$id,
          serviceTitle: service.title,
          originalPrice: service.price,
          bargainPrice: data.bargainPrice,
          message: data.message,
          status: "pending",
          buyerId: user.$id,
          buyerName: user.name,
          sellerId: service.providerId, // Corrected from posterId
          sellerName: service.providerName, // Corrected from posterName
          sellerUpiId: service.contact, // Assuming contact is UPI ID for services
          buyerUpiId: userProfile.upiId,
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          You are bargaining for: <span className="font-semibold text-foreground">{service.title}</span>
        </p>
        <p className="text-xs text-muted-foreground">Original Price: <span className="font-medium text-secondary-neon">{service.price}</span></p>
        <p className="text-xs text-muted-foreground">Provider: {service.providerName}</p> {/* Corrected from posterName */}
        <p className="text-xs text-destructive-foreground">
          Note: Bargaining is a direct negotiation. Be respectful and fair.
        </p>

        <FormField
          control={form.control}
          name="bargainPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Your Bargain Price (₹)</FormLabel>
              <FormControl>
                <Input type="text" placeholder="e.g., ₹120" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Message (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 'Can you do ₹120 for quick pickup?'" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Bargain Request"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default BargainServiceDialog;