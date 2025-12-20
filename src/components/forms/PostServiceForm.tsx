"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// Define the Zod schema for the form
const ServiceFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  category: z.string().min(1, { message: "Please select a category." }),
  otherCategoryDescription: z.string().optional(), // For 'other' category
  price: z.string().min(1, { message: "Price is required." }),
  contact: z.string().min(5, { message: "Contact information is required." }),
  isCustomOrder: z.boolean().default(false),
});

interface PostServiceFormProps {
  onSubmit: (data: z.infer<typeof ServiceFormSchema>) => Promise<void>;
  onCancel: () => void;
  categoryOptions: { value: string; label: string }[];
  initialCategory?: string; // NEW: Add initialCategory prop
}

const PostServiceForm: React.FC<PostServiceFormProps> = ({ onSubmit, onCancel, categoryOptions, initialCategory }) => {
  const form = useForm<z.infer<typeof ServiceFormSchema>>({
    resolver: zodResolver(ServiceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: initialCategory || "", // NEW: Use initialCategory for default value
      otherCategoryDescription: "",
      price: "",
      contact: "",
      isCustomOrder: false,
    },
  });

  // NEW: Reset form with initialCategory if it changes
  useEffect(() => {
    if (initialCategory) {
      form.reset({ ...form.getValues(), category: initialCategory });
    }
  }, [initialCategory, form]);

  const { isSubmitting } = form.formState;

  const handleFormSubmit = async (data: z.infer<typeof ServiceFormSchema>) => {
    try {
      await onSubmit(data);
      form.reset(); // Reset form after successful submission
    } catch (error) {
      // Error handling is done in the parent component's onSubmit
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 p-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Service Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Math Tutoring, Graphic Design" {...field} className="bg-input text-input-foreground border-border focus-visible:ring-secondary-neon" />
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
                <Textarea placeholder="Describe your service in detail..." {...field} rows={4} className="bg-input text-input-foreground border-border focus-visible:ring-secondary-neon" />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-input text-input-foreground border-border focus-visible:ring-secondary-neon">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-card text-card-foreground border-border">
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
        {form.watch("category") === "other" && (
          <FormField
            control={form.control}
            name="otherCategoryDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Specify Other Category</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Language Translation" {...field} className="bg-input text-input-foreground border-border focus-visible:ring-secondary-neon" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Price/Compensation</FormLabel>
              <FormControl>
                <Input placeholder="e.g., ₹500/hour, Negotiable" {...field} className="bg-input text-input-foreground border-border focus-visible:ring-secondary-neon" />
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
                <Input placeholder="e.g., WhatsApp number, Email" {...field} className="bg-input text-input-foreground border-border focus-visible:ring-secondary-neon" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isCustomOrder"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-card text-card-foreground border-border">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="border-secondary-neon data-[state=checked]:bg-secondary-neon data-[state=checked]:text-primary-foreground"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-foreground">
                  Offer Custom Orders
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  Allow users to request custom services based on your skills.
                </p>
              </div>
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="border-border text-primary-foreground hover:bg-muted">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Post Service"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PostServiceForm;