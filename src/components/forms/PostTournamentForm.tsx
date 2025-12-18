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
import { Loader2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TOURNAMENTS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import { Tournament } from "@/hooks/useTournamentData"; // Import Tournament interface

const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  game: z.string().min(2, { message: "Game name is required." }),
  platform: z.string().min(2, { message: "Platform is required." }),
  startDate: z.string().min(1, { message: "Start date is required." }),
  endDate: z.string().min(1, { message: "End date is required." }),
  registrationLink: z.string().url({ message: "Must be a valid URL." }),
  prizePool: z.string().optional(),
  rulesLink: z.string().url({ message: "Must be a valid URL." }).optional().or(z.literal('')),
  maxParticipants: z.number().min(2, { message: "Minimum 2 participants." }).optional(),
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

interface PostTournamentFormProps {
  onSubmit: (data: Omit<Tournament, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "organizerId" | "organizerName" | "collegeName" | "status" | "participants">) => void;
  onCancel: () => void;
}

const PostTournamentForm: React.FC<PostTournamentFormProps> = ({ onSubmit, onCancel }) => {
  const { user, userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      game: "",
      platform: "",
      startDate: "",
      endDate: "",
      registrationLink: "",
      prizePool: "",
      rulesLink: "",
      maxParticipants: undefined,
    },
  });

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Failed to post tournament.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Tournament Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Valorant Campus Clash" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Textarea placeholder="Details about the tournament, format, etc." {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="game"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Game</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Valorant, Chess" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="platform"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Platform</FormLabel>
              <FormControl>
                <Input placeholder="e.g., PC, Mobile, Board" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="registrationLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Registration Link</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://forms.gle/..." {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="prizePool"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Prize Pool (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., ₹5000, Trophies" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rulesLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Rules Link (Optional)</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://docs.google.com/..." {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maxParticipants"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Max Participants (Optional)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="32" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><PlusCircle className="mr-2 h-4 w-4" /> Create Tournament</>}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default PostTournamentForm;