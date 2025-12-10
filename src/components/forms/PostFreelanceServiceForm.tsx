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
import { toast } from "sonner";

const freelanceCategories = [
  { value: "resume-building", label: "Resume Building" },
  { value: "video-editing", label: "Video Editing" },
  { value: "content-writing", label: "Content Writing" },
  { value: "graphic-design", label: "Graphic Design" },
  { value: "tutoring", label: "Tutoring" },
  { value: "web-development", label: "Web Development" },
  { value: "app-development", label: "App Development" },
  { value: "photography", label: "Photography" },
  { value: "other", label: "Other" },
];

const formSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  category: z.string().min(1, "Category is required."),
  otherCategory: z.string().optional(), // For "Other" category input
  price: z.string().min(1, "Price is required."),
  contact: z.string().min(10, "Contact information is required."),
  ambassadorDelivery: z.boolean().default(false).optional(),
  ambassadorMessage: z.string().optional(),
});

interface PostFreelanceServiceFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
  onCancel: () => void;
}

const PostFreelanceServiceForm: React.FC<PostFreelanceServiceFormProps> = ({ onSubmit, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      otherCategory: "",
      price: "",
      contact: "",
      ambassadorDelivery: false,
      ambassadorMessage: "",
    },
  });

  const selectedCategory = form.watch("category");
  const showOtherCategoryInput = selectedCategory === "other";

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      // If "Other" is selected, use the value from otherCategory field
      const finalCategory = data.category === "other" && data.otherCategory
        ? data.otherCategory
        : data.category;

      await onSubmit({ ...data, category: finalCategory });
      toast.success("Freelance service posted successfully!");
    } catch (e: any) {
      console.error("Error posting freelance service:", e);
      toast.error(e.message || "Failed to post freelance service.");
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
                <Input {...field} placeholder="e.g., Professional Resume Writing" disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Textarea {...field} placeholder="Describe your service, experience, and what you offer..." disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring min-h-[80px]" />
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
                  {freelanceCategories.map((option) => (
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
        {showOtherCategoryInput && (
          <FormField
            control={form.control}
            name="otherCategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Specify Other Category</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Language Translation" disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
              <FormLabel className="text-foreground">Price/Rate</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., 500 INR per resume or 200 INR/hour" disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Input {...field} placeholder="e.g., +91 9876543210 or @your_telegram_id" disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                  Ambassador Facilitation
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  Opt-in for a campus ambassador to facilitate the service exchange (e.g., document delivery).
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
                <FormLabel className="text-foreground">Facilitation Instructions</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="e.g., Need documents picked up from Block C and delivered to Block A." disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring min-h-[60px]" />
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
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Post Service"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PostFreelanceServiceForm;