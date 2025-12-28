"use client";

import React, { useEffect, useState } from "react"; // NEW: Import useState
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, X } from "lucide-react"; // NEW: Import X icon
import { toast } from "sonner";
import DeletionInfoMessage from "@/components/DeletionInfoMessage";
import { Alert, AlertDescription } from "@/components/ui/alert"; // NEW: Import Alert components

// Define the Zod schema for the form
const ServiceFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  category: z.string().min(1, { message: "Please select a category." }),
  otherCategoryDescription: z.string().optional(), // For 'other' category
  price: z.string().min(1, { message: "Price is required." }),
  contact: z.string().min(5, { message: "Contact information is required." }),
  isCustomOrder: z.boolean().default(false),
  customOrderDescription: z.string().optional(), // NEW: Added customOrderDescription to schema
  ambassadorDelivery: z.boolean().default(false), // NEW: Added ambassadorDelivery to schema
  ambassadorMessage: z.string().optional(), // NEW: Added ambassadorMessage to schema
});

interface PostServiceFormProps {
  onSubmit: (data: z.infer<typeof ServiceFormSchema>) => Promise<void>;
  onCancel: () => void;
  categoryOptions: { value: string; label: string }[];
  initialCategory?: string;
  isCustomOrder?: boolean; // NEW: Add isCustomOrder prop
  titlePlaceholder?: string; // NEW: Add titlePlaceholder prop
  descriptionPlaceholder?: string; // NEW: Add descriptionPlaceholder prop
  customOrderDescriptionPlaceholder?: string; // NEW: Add customOrderDescriptionPlaceholder prop
  pricePlaceholder?: string; // NEW: Add pricePlaceholder prop
  contactPlaceholder?: string; // NEW: Add contactPlaceholder prop
  ambassadorMessagePlaceholder?: string; // NEW: Add ambassadorMessagePlaceholder prop
}

const PostServiceForm: React.FC<PostServiceFormProps> = ({
  onSubmit,
  onCancel,
  categoryOptions,
  initialCategory,
  isCustomOrder = false, // NEW: Default to false
  titlePlaceholder = "e.g., Math Tutoring, Graphic Design", // NEW: Default placeholder
  descriptionPlaceholder = "Describe your service in detail...", // NEW: Default placeholder
  customOrderDescriptionPlaceholder = "Specify details like ingredients, dietary restrictions, quantity, preferred time.", // NEW: Default placeholder
  pricePlaceholder = "e.g., ₹500/hour, Negotiable", // NEW: Default placeholder
  contactPlaceholder = "e.g., WhatsApp number, Email", // NEW: Default placeholder
  ambassadorMessagePlaceholder = "e.g., Deliver to Block A, Room 101 by 7 PM", // NEW: Default placeholder
}) => {
  const form = useForm<z.infer<typeof ServiceFormSchema>>({
    resolver: zodResolver(ServiceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: initialCategory || "",
      otherCategoryDescription: "",
      price: "",
      contact: "",
      isCustomOrder: isCustomOrder, // NEW: Use prop for default value
      customOrderDescription: "", // Initialize
      ambassadorDelivery: false, // Initialize
      ambassadorMessage: "", // Initialize
    },
  });

  const [showFormInfoAlert, setShowFormInfoAlert] = useState(true); // NEW: State for dismissible alert

  useEffect(() => {
    if (initialCategory) {
      form.reset({ ...form.getValues(), category: initialCategory });
    }
    // Also update isCustomOrder if the prop changes
    form.setValue("isCustomOrder", isCustomOrder);
  }, [initialCategory, isCustomOrder, form]);

  const { isSubmitting } = form.formState;

  const handleFormSubmit = async (data: z.infer<typeof ServiceFormSchema>) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      // Error handling is done in the parent component's onSubmit
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 p-4">
        {showFormInfoAlert && ( // NEW: Conditionally render dismissible alert
          <Alert className="bg-blue-50 border-blue-200 text-blue-800 flex items-center justify-between">
            <AlertDescription>
              Please fill out the details below to post your service or custom order request.
            </AlertDescription>
            <Button variant="ghost" size="icon" onClick={() => setShowFormInfoAlert(false)} className="text-blue-800 hover:bg-blue-100">
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        )}

        {/* NEW: Scroll pane for form fields */}
        <div className="max-h-[calc(100vh-250px)] overflow-y-auto pr-2"> {/* Adjust height as needed */}
          <DeletionInfoMessage /> {/* NEW: Deletion Info Message */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Service Title</FormLabel>
                <FormControl>
                  <Input placeholder={titlePlaceholder} {...field} className="bg-input text-input-foreground border-border focus-visible:ring-secondary-neon" />
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
                  <Textarea placeholder={descriptionPlaceholder} {...field} rows={4} className="bg-input text-input-foreground border-border focus-visible:ring-secondary-neon" />
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
          {isCustomOrder && ( // Only show custom order description if it's a custom order form
            <FormField
              control={form.control}
              name="customOrderDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Custom Order Details</FormLabel>
                  <FormControl>
                    <Textarea placeholder={customOrderDescriptionPlaceholder} {...field} rows={3} className="bg-input text-input-foreground border-border focus-visible:ring-secondary-neon" />
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
                  <Input placeholder={pricePlaceholder} {...field} className="bg-input text-input-foreground border-border focus-visible:ring-secondary-neon" />
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
                  <Input placeholder={contactPlaceholder} {...field} className="bg-input text-input-foreground border-border focus-visible:ring-secondary-neon" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {!isCustomOrder && ( // Only show this checkbox if it's not a custom order form
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
          )}
        </div> {/* END: Scroll pane */}
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