"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_MARKETPLACE_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from "appwrite";

const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  category: z.string().min(1, { message: "Please select a category." }),
  price: z.string().min(1, { message: "Price is required." }),
  condition: z.string().min(1, { message: "Condition is required." }),
  contact: z.string().min(5, { message: "Contact information is required." }),
  type: z.enum(["sell", "rent", "gift", "sports"]),
  rentalPeriod: z.string().optional(),
  ambassadorDelivery: z.boolean().optional(),
  ambassadorMessage: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "rent" && !data.rentalPeriod?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Rental period is required for renting.",
      path: ["rentalPeriod"],
    });
  }
  if (data.ambassadorDelivery && !data.ambassadorMessage?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please provide a message for ambassador delivery.",
      path: ["ambassadorMessage"],
    });
  }
});

interface MarketListingFormWrapperProps {
  onListingPosted: () => void;
  onCancel: () => void;
}

const CATEGORY_OPTIONS = [
  { value: "electronics", label: "Electronics" },
  { value: "books", label: "Books" },
  { value: "clothing", label: "Clothing" },
  { value: "furniture", label: "Furniture" },
  { value: "sports-equipment", label: "Sports Equipment" },
  { value: "other", label: "Other" },
];

const CONDITION_OPTIONS = [
  { value: "new", label: "New" },
  { value: "like-new", label: "Like New" },
  { value: "used-good", label: "Used (Good)" },
  { value: "used-fair", label: "Used (Fair)" },
];

const RENTAL_PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "semester", label: "Semester" },
];

const MarketListingFormWrapper: React.FC<MarketListingFormWrapperProps> = ({ onListingPosted, onCancel }) => {
  const [activeTab, setActiveTab] = useState<"sell" | "rent" | "gift" | "sports">("sell");
  const { user, userProfile, recordMarketListing } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      price: "",
      condition: "",
      contact: "",
      type: "sell",
      rentalPeriod: "",
      ambassadorDelivery: false,
      ambassadorMessage: "",
    },
  });

  React.useEffect(() => {
    form.setValue("type", activeTab);
    form.clearErrors();
  }, [activeTab, form]);

  const watchAmbassadorDelivery = form.watch("ambassadorDelivery");

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a listing.");
      return;
    }

    setIsSubmitting(true);
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_MARKETPLACE_COLLECTION_ID,
        ID.unique(),
        {
          ...data,
          posterId: user.$id,
          posterName: user.name,
          collegeName: userProfile.collegeName,
        }
      );
      toast.success("Marketplace listing posted successfully!");
      recordMarketListing();
      onListingPosted();
      form.reset();
    } catch (error: any) {
      console.error("Error posting listing:", error);
      toast.error(error.message || "Failed to post listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "sell" | "rent" | "gift" | "sports")} className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-muted text-muted-foreground">
        <TabsTrigger value="sell">Sell</TabsTrigger>
        <TabsTrigger value="rent">Rent</TabsTrigger>
        <TabsTrigger value="gift">Gift</TabsTrigger>
        <TabsTrigger value="sports">Sports</TabsTrigger>
      </TabsList>
      <TabsContent value={activeTab} className="mt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Old Textbooks, Gaming Console" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Provide details about the item..." {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger className="bg-input text-foreground border-border focus:ring-ring focus:border-ring">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover text-popover-foreground border-border">
                      {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {activeTab !== "gift" && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Price (₹)</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="e.g., 500, Negotiable" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {activeTab === "rent" && (
              <FormField
                control={form.control}
                name="rentalPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Rental Period</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger className="bg-input text-foreground border-border focus:ring-ring focus:border-ring">
                          <SelectValue placeholder="Select rental period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover text-popover-foreground border-border">
                        {RENTAL_PERIOD_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Condition</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger className="bg-input text-foreground border-border focus:ring-ring focus:border-ring">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover text-popover-foreground border-border">
                      {CONDITION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Contact Information</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., WhatsApp number, Email" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ambassadorDelivery"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-foreground">
                      Offer Ambassador Delivery?
                    </FormLabel>
                    <FormDescription className="text-muted-foreground">
                      Allow campus ambassadors to deliver your item.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            {watchAmbassadorDelivery && (
              <FormField
                control={form.control}
                name="ambassadorMessage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Ambassador Delivery Message</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., 'Please deliver to hostel block C, room 201'" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><PlusCircle className="mr-2 h-4 w-4" /> Post Listing</>}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
};

export default MarketListingFormWrapper;