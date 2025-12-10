"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  category: z.string().min(1, "Category is required."),
  price: z.string().min(1, "Price is required."),
  contact: z.string().min(10, "Contact information is required."),
  customOrderDescription: z.string().optional(),
  ambassadorDelivery: z.boolean().default(false).optional(),
  ambassadorMessage: z.string().optional(),
});

interface PostServiceFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
  onCancel: () => void;
  isCustomOrder?: boolean;
  categoryOptions: { value: string; label: string }[];
  titlePlaceholder?: string;
  descriptionPlaceholder?: string;
  pricePlaceholder?: string;
  contactPlaceholder?: string;
  customOrderDescriptionPlaceholder?: string;
  ambassadorMessagePlaceholder?: string;
}

const PostServiceForm: React.FC<PostServiceFormProps> = ({
  onSubmit,
  onCancel,
  isCustomOrder = false,
  categoryOptions,
  titlePlaceholder = "e.g., Delicious Homemade Biryani",
  descriptionPlaceholder = "Describe your offering or request in detail...",
  pricePlaceholder = "e.g., 150 INR or Negotiable",
  contactPlaceholder = "e.g., +91 9876543210 or @your_telegram_id",
  customOrderDescriptionPlaceholder = "Specify your custom food or remedy request...",
  ambassadorMessagePlaceholder = "e.g., Deliver to Block A, Room 101 by 7 PM",
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      price: "",
      contact: "",
      customOrderDescription: "",
      ambassadorDelivery: false,
      ambassadorMessage: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">{isCustomOrder ? "Request Title" : "Offering Title"}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={titlePlaceholder} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Textarea {...field} placeholder={descriptionPlaceholder} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring min-h-[80px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isCustomOrder && (
          <FormField
            control={form.control}
            name="customOrderDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Custom Request Details</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder={customOrderDescriptionPlaceholder} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring min-h-[80px]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
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
                  {categoryOptions.map((option) => (
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
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Price</FormLabel>
              <FormControl>
                <Input {...field} placeholder={pricePlaceholder} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
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
                <Input {...field} placeholder={contactPlaceholder} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ambassadorDelivery"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-border p-4 shadow">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                  className="border-border data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-foreground">
                  Ambassador Delivery
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  Opt-in for delivery by a campus ambassador (additional charges may apply).
                </p>
              </div>
            </FormItem>
          )}
        />
        {form.watch("ambassadorDelivery") && (
          <FormField
            control={form.control}
            name="ambassadorMessage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Delivery Instructions</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder={ambassadorMessagePlaceholder} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring min-h-[60px]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="border-border text-primary-foreground hover:bg-muted">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isCustomOrder ? "Post Request" : "Post Offering")}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PostServiceForm;