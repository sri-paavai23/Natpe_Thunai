"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define the form schema using Zod
const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  category: z.string().min(1, "Service category is required."),
  compensation: z.string().min(1, "Compensation is required."),
  deadline: z.string().optional(), // Optional deadline
  contact: z.string().min(1, "Contact information is required."),
  otherCategory: z.string().optional(), // For custom category if 'other' is selected
});

export type ServicePostData = z.infer<typeof formSchema>;

interface PostServiceFormProps {
  onSubmit: (data: ServicePostData) => Promise<void>;
  onCancel: () => void;
  categoryOptions: { value: string; label: string }[];
  initialCategory?: string; // Prop for initial category
  serviceType: "freelance" | "short-term"; // Prop to specify service type
}

const PostServiceForm: React.FC<PostServiceFormProps> = ({ onSubmit, onCancel, categoryOptions, initialCategory, serviceType }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ServicePostData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: initialCategory || "", // Set initial category
      compensation: "",
      deadline: "",
      contact: "",
      otherCategory: "",
    },
  });

  // Update form default value if initialCategory changes
  useEffect(() => {
    if (initialCategory) {
      form.setValue("category", initialCategory);
    }
  }, [initialCategory, form]);

  const selectedCategory = form.watch("category");

  const handleSubmit = async (data: ServicePostData) => {
    setIsSubmitting(true);
    try {
      // If 'other' is selected, use the value from 'otherCategory'
      const finalData = {
        ...data,
        category: data.category === "other" && data.otherCategory ? data.otherCategory : data.category,
      };
      await onSubmit(finalData);
      form.reset();
    } catch (error: any) {
      console.error("Error posting service:", error);
      toast.error(error.message || "Failed to post service.");
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
              <FormLabel className="text-foreground">Service Title</FormLabel>
              <FormControl>
                <Input {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Textarea {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
              <FormLabel className="text-foreground">Service Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger className="w-full bg-input text-foreground border-border focus:ring-ring focus:border-ring">
                    <SelectValue placeholder={`Select a ${serviceType} category`} />
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
        {selectedCategory === "other" && (
          <FormField
            control={form.control}
            name="otherCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Specify Other Category</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Input {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Input type="date" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Input {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><PlusCircle className="mr-2 h-4 w-4" /> Post Service</>}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default PostServiceForm;