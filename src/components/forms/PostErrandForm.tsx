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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import DeletionInfoMessage from "@/components/DeletionInfoMessage";

// Define the schema for the form
const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  type: z.string().min(1, { message: "Please select a need type." }),
  otherTypeDescription: z.string().optional(), // For 'other' type
  compensation: z.string().min(2, { message: "Compensation details are required." }),
  deadline: z.date().optional(),
  contact: z.string().min(5, { message: "Contact information is required." }),
});

interface PostErrandFormProps {
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>;
  onCancel: () => void;
  typeOptions: { value: string; label: string }[];
  initialType?: string;
}

const PostErrandForm: React.FC<PostErrandFormProps> = ({ onSubmit, onCancel, typeOptions, initialType }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "",
      otherTypeDescription: "",
      compensation: "",
      deadline: undefined,
      contact: "",
    },
  });

  // Effect to set initial type when component mounts or initialType changes
  useEffect(() => {
    if (initialType) {
      const isStandardType = typeOptions.some(option => option.value === initialType);
      if (isStandardType) {
        form.setValue("type", initialType);
        form.setValue("otherTypeDescription", ""); // Clear if it was previously 'other'
      } else {
        form.setValue("type", "other");
        form.setValue("otherTypeDescription", initialType);
      }
    } else {
      // Reset type if initialType is cleared (e.g., after form submission/cancel)
      form.setValue("type", "");
      form.setValue("otherTypeDescription", "");
    }
  }, [initialType, typeOptions, form]);

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    await onSubmit(data);
  };

  const selectedType = form.watch("type");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <DeletionInfoMessage />
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Need Title</FormLabel> {/* Changed label */}
              <FormControl>
                <Input placeholder="e.g., Help with math homework" {...field} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Provide details about your need..." {...field} />
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
              <FormLabel>Need Type</FormLabel> {/* Changed label */}
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a need type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {typeOptions.map((option) => (
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

        {selectedType === "other" && (
          <FormField
            control={form.control}
            name="otherTypeDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Specify Other Type</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Help with coding assignment" {...field} />
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
              <FormLabel>Compensation</FormLabel>
              <FormControl>
                <Input placeholder="e.g., $10, coffee, help with homework" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="deadline"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Deadline (Optional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Information</FormLabel>
              <FormControl>
                <Input placeholder="e.g., @your_username, 123-456-7890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Post Need</Button> {/* Changed button text */}
        </div>
      </form>
    </Form>
  );
};

export default PostErrandForm;