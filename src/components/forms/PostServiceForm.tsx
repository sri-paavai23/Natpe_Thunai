"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

// Define the schema for the form
const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  category: z.string().min(1, { message: "Please select a category." }),
  otherCategoryDescription: z.string().optional(),
  compensation: z.string().optional(), // Made optional as 'price' might be used instead
  deadline: z.string().optional(),
  contact: z.string().min(5, { message: "Contact information is required." }),
  price: z.string().optional(), // New field for direct price
  isCustomOrder: z.boolean().optional(), // New field to indicate custom order
  customOrderDescription: z.string().optional(), // New field for custom order details
  ambassadorDelivery: z.boolean().optional(), // New field for ambassador delivery
  ambassadorMessage: z.string().optional(), // New field for ambassador message
}).superRefine((data, ctx) => {
  if (data.category === 'other' && !data.otherCategoryDescription?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please specify the 'Other' category.",
      path: ["otherCategoryDescription"],
    });
  }
  // If it's a custom order, customOrderDescription is required
  if (data.isCustomOrder && !data.customOrderDescription?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please provide details for your custom order.",
      path: ["customOrderDescription"],
    });
  }
  // If not a custom order, price is required
  if (!data.isCustomOrder && !data.price?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please provide a price for your service/offering.",
      path: ["price"],
    });
  }
  // If ambassador delivery is selected, ambassador message is required
  if (data.ambassadorDelivery && !data.ambassadorMessage?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Please provide a message for ambassador delivery.",
      path: ["ambassadorMessage"],
    });
  }
});

// Define the props for the component
interface PostServiceFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
  categoryOptions: { value: string; label: string }[];
  initialCategory?: string;
  titlePlaceholder?: string; // New prop
  descriptionPlaceholder?: string; // New prop
  compensationPlaceholder?: string; // New prop
  deadlinePlaceholder?: string; // New prop
  contactPlaceholder?: string; // New prop
  pricePlaceholder?: string; // New prop
  customOrderDescriptionPlaceholder?: string; // New prop
  ambassadorMessagePlaceholder?: string; // New prop
  isCustomOrder?: boolean; // New prop
  showAmbassadorDelivery?: boolean; // New prop to control visibility of ambassador delivery option
}

const PostServiceForm: React.FC<PostServiceFormProps> = ({
  onSubmit,
  onCancel,
  categoryOptions,
  initialCategory,
  titlePlaceholder = "e.g., Offering Math Tutoring",
  descriptionPlaceholder = "Provide details about your service...",
  compensationPlaceholder = "e.g., ₹500/hour, Free for first session",
  deadlinePlaceholder = "e.g., Weekends, By end of month",
  contactPlaceholder = "e.g., WhatsApp number, Email",
  pricePlaceholder = "e.g., ₹150, ₹200/plate",
  customOrderDescriptionPlaceholder = "Describe your custom order request (e.g., 'Need a vegan meal prep for 5 days')",
  ambassadorMessagePlaceholder = "e.g., 'Please deliver to hostel block C, room 201'",
  isCustomOrder = false,
  showAmbassadorDelivery = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: initialCategory || "",
      otherCategoryDescription: "",
      compensation: "",
      deadline: "",
      contact: "",
      price: "",
      isCustomOrder: isCustomOrder,
      customOrderDescription: "",
      ambassadorDelivery: false,
      ambassadorMessage: "",
    },
  });

  // Update form's category and isCustomOrder if initial props change
  useEffect(() => {
    if (initialCategory && initialCategory !== form.getValues("category")) {
      form.setValue("category", initialCategory);
    }
    if (isCustomOrder !== form.getValues("isCustomOrder")) {
      form.setValue("isCustomOrder", isCustomOrder);
    }
  }, [initialCategory, isCustomOrder, form]);

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to post service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = form.watch("category");
  const watchIsCustomOrder = form.watch("isCustomOrder");
  const watchAmbassadorDelivery = form.watch("ambassadorDelivery");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Title</FormLabel>
              <FormControl>
                <Input placeholder={titlePlaceholder} {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Textarea placeholder={descriptionPlaceholder} {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
        {selectedCategory === 'other' && (
          <FormField
            control={form.control}
            name="otherCategoryDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Specify Other Category</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Event Photography, Custom Art" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {watchIsCustomOrder ? (
          <FormField
            control={form.control}
            name="customOrderDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Custom Order Details</FormLabel>
                <FormControl>
                  <Textarea placeholder={customOrderDescriptionPlaceholder} {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Price</FormLabel>
                <FormControl>
                  <Input placeholder={pricePlaceholder} {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Compensation field (optional, can be used alongside or instead of price) */}
        {!watchIsCustomOrder && ( // Only show compensation if not a custom order
          <FormField
            control={form.control}
            name="compensation"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Compensation (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder={compensationPlaceholder} {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Availability/Deadline (Optional)</FormLabel>
              <FormControl>
                <Input type="text" placeholder={deadlinePlaceholder} {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Input placeholder={contactPlaceholder} {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {showAmbassadorDelivery && (
          <>
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
                      Allow campus ambassadors to deliver your offering.
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
                      <Textarea placeholder={ambassadorMessagePlaceholder} {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </>
        )}

        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><PlusCircle className="mr-2 h-4 w-4" /> {watchIsCustomOrder ? "Post Request" : "Post Service"}</>}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default PostServiceForm;