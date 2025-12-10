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
  type: z.enum(["lost", "found"], {
    required_error: "Please select if the item is lost or found.",
  }),
  location: z.string().min(1, "Location is required."),
  contact: z.string().min(1, "Contact information is required."),
});

export type LostFoundPostData = z.infer<typeof formSchema>;

interface PostLostFoundFormProps {
  onSubmit: (data: LostFoundPostData) => Promise<void>;
  onCancel: () => void;
  initialType?: "lost" | "found"; // Prop for initial type
}

const PostLostFoundForm: React.FC<PostLostFoundFormProps> = ({ onSubmit, onCancel, initialType }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LostFoundPostData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: initialType || "lost", // Set initial type, default to 'lost'
      location: "",
      contact: "",
    },
  });

  // Update form default value if initialType changes
  useEffect(() => {
    if (initialType) {
      form.setValue("type", initialType);
    }
  }, [initialType, form]);

  const handleSubmit = async (data: LostFoundPostData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
    } catch (error: any) {
      console.error("Error posting lost/found item:", error);
      toast.error(error.message || "Failed to post item.");
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
              <FormLabel className="text-foreground">Item Title</FormLabel>
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
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Item Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger className="w-full bg-input text-foreground border-border focus:ring-ring focus:border-ring">
                    <SelectValue placeholder="Select if item is lost or found" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-popover text-popover-foreground border-border">
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="found">Found</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Location (Where it was lost/found)</FormLabel>
              <FormControl>
                <Input {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><PlusCircle className="mr-2 h-4 w-4" /> Post Item</>}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default PostLostFoundForm;