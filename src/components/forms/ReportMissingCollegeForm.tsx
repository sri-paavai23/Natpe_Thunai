"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_MISSING_COLLEGES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";

const formSchema = z.object({
  collegeName: z.string().min(2, { message: "College name is required." }),
  message: z.string().optional(),
});

interface ReportMissingCollegeFormProps {
  onReportSent: () => void;
  onCancel: () => void;
}

const ReportMissingCollegeForm: React.FC<ReportMissingCollegeFormProps> = ({ onReportSent, onCancel }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      collegeName: "",
      message: "",
    },
  });

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error("You must be logged in to report a missing college.");
      return;
    }

    setIsSubmitting(true);
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_MISSING_COLLEGES_COLLECTION_ID,
        ID.unique(),
        {
          collegeName: data.collegeName,
          message: data.message,
          reporterId: user.$id,
          reporterName: user.name,
          status: "pending",
        }
      );
      toast.success("Missing college report sent successfully!");
      onReportSent();
      form.reset();
    } catch (error: any) {
      console.error("Error reporting missing college:", error);
      toast.error(error.message || "Failed to send report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="collegeName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">College Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Indian Institute of Technology Bombay" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Additional Message (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Any other details about the college..." {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Report"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default ReportMissingCollegeForm;