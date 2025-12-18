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

// Define the schema for the form
const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  type: z.string().min(1, { message: "Please select a type." }), // Changed from category to type
  otherTypeDescription: z.string().optional(), // New field for 'other' type
  compensation: z.string().min(2, { message: "Compensation details are required." }),
  deadline: z.string().optional(),
  contact: z.string().min(5, { message: "Contact information is required." }),
});

// Define the props for the component
interface PostErrandFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
  typeOptions: { value: string; label: string }[]; // Changed from categoryOptions to typeOptions
  initialType?: string; // Changed from initialCategory to initialType
}

const PostErrandForm: React.FC<PostErrandFormProps> = ({
  onSubmit,
  onCancel,
  typeOptions, // Changed from categoryOptions
  initialType, // Changed from initialCategory
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: initialType || "", // Use initialType if provided
      otherTypeDescription: "",
      compensation: "",
      deadline: "",
      contact: "",
    },
  });

  // Update form's type if initialType changes
  useEffect(() => {
    if (initialType && initialType !== form.getValues("type")) {
      form.setValue("type", initialType);
    }
  }, [initialType, form]);

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // If type is 'other' and otherTypeDescription is empty, show error
      if (data.type === 'other' && !data.otherTypeDescription?.trim()) {
        form.setError("otherTypeDescription", {
          type: "manual",
          message: "Please specify the 'Other' type.",
        });
        toast.error("Please specify the 'Other' type.");
        return;
      }
      await onSubmit(data);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to post errand.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = form.watch("type"); // Changed from selectedCategory

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
                <Input placeholder="e.g., Need help moving books" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Textarea placeholder="Provide details about the errand..." {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type" // Changed from category
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger className="bg-input text-foreground border-border focus:ring-ring focus:border-ring">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-popover text-popover-foreground border-border">
                  {typeOptions.map((option) => ( // Changed from categoryOptions
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
        {selectedType === 'other' && ( // Changed from selectedCategory
          <FormField
            control={form.control}
            name="otherTypeDescription" // Changed from otherCategoryDescription
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Specify Other Type</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Academic Tutoring, Pet Sitting" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="compensation"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Compensation</FormLabel>
              <FormControl>
                <Input placeholder="e.g., ₹200, Coffee, Help with a task" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Deadline (Optional)</FormLabel>
              <FormControl>
                <Input type="text" placeholder="e.g., Tomorrow 5 PM, End of week" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Input placeholder="e.g., WhatsApp number, Email" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><PlusCircle className="mr-2 h-4 w-4" /> Post Request</>}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default PostErrandForm;