"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, MapPin, Clock, Banknote } from "lucide-react";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CASH_EXCHANGE_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from "appwrite";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const formSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  meetingLocation: z.string().min(3, "Location is required"),
  meetingTime: z.string().min(1, "Time is required"),
  notes: z.string().optional(),
});

interface CashExchangeFormProps {
  type: "request" | "offer" | "group-contribution";
  onSuccess: () => void;
  onCancel: () => void;
}

const CashExchangeForm: React.FC<CashExchangeFormProps> = ({ type, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      meetingLocation: "",
      meetingTime: "",
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CASH_EXCHANGE_COLLECTION_ID,
        ID.unique(),
        {
          type: type,
          amount: parseFloat(values.amount),
          meetingLocation: values.meetingLocation,
          meetingTime: values.meetingTime,
          notes: values.notes || (type === 'group-contribution' ? "Bill Split" : "No notes"),
          status: "Open",
          posterId: user.$id,
          posterName: user.name,
          collegeName: user.prefs?.collegeName || "Unknown",
        }
      );
      toast.success("Posted successfully!");
      onSuccess();
    } catch (error: any) {
      console.error("Error creating listing:", error);
      toast.error("Failed to post listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Dynamic Labels ---
  const labels = type === 'group-contribution' ? {
      amount: "Total Bill Amount (₹)",
      notes: "What is this split for? (e.g. Birthday Cake)",
      location: "Collection Point",
      submit: "Start Group Pool"
  } : {
      amount: "Amount (₹)",
      notes: "Notes (Optional)",
      location: "Meeting Location",
      submit: type === 'request' ? "Post Request" : "Post Offer"
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">{labels.amount}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Banknote className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="number" placeholder="500" {...field} className="pl-9 bg-background" />
                </div>
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
              <FormLabel className="text-foreground">Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={labels.notes} 
                  className="resize-none bg-background" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
            <FormField
            control={form.control}
            name="meetingLocation"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="text-foreground">{labels.location}</FormLabel>
                <FormControl>
                    <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Canteen" {...field} className="pl-9 bg-background" />
                    </div>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="meetingTime"
            render={({ field }) => (
                <FormItem>
                <FormLabel className="text-foreground">Time</FormLabel>
                <FormControl>
                    <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="1:00 PM" {...field} className="pl-9 bg-background" />
                    </div>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 w-full sm:w-auto">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : labels.submit}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CashExchangeForm;