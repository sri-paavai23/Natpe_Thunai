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
import { Loader2, PlusCircle, CalendarIcon } from "lucide-react"; // Added CalendarIcon
import { toast } from "sonner";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TOURNAMENTS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Added Popover
import { Calendar } from "@/components/ui/calendar"; // Added Calendar
import { format } from "date-fns"; // Added format from date-fns
import { cn } from "@/lib/utils"; // Added cn

// Define common game options
const GAME_OPTIONS = [
  { value: "valorant", label: "Valorant" },
  { value: "cs2", label: "Counter-Strike 2" },
  { value: "dota2", label: "Dota 2" },
  { value: "mobile-legends", label: "Mobile Legends" },
  { value: "bgmi", label: "BGMI" },
  { value: "other", label: "Other" },
];

const formSchema = z.object({
  name: z.string().min(3, { message: "Tournament name must be at least 3 characters." }),
  game: z.string().min(1, { message: "Please select a game." }),
  otherGameDescription: z.string().optional(), // For 'other' game type
  date: z.string().min(1, { message: "Date is required." }), // Changed to string for date picker output
  fee: z.preprocess(
    (val) => Number(val),
    z.number().min(0, { message: "Fee cannot be negative." })
  ),
  prizePool: z.string().min(1, { message: "Prize pool details are required." }),
  minPlayers: z.preprocess(
    (val) => Number(val),
    z.number().min(1, { message: "Minimum players must be at least 1." })
  ),
  maxPlayers: z.preprocess(
    (val) => Number(val),
    z.number().min(1, { message: "Maximum players must be at least 1." })
  ),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  rules: z.string().min(10, { message: "Rules must be at least 10 characters." }),
});

interface PostTournamentFormProps {
  onTournamentPosted: () => void;
  onCancel: () => void;
}

const PostTournamentForm: React.FC<PostTournamentFormProps> = ({ onTournamentPosted, onCancel }) => {
  const { user, userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      game: "",
      otherGameDescription: "",
      date: "",
      fee: 0,
      prizePool: "",
      minPlayers: 1,
      maxPlayers: 5,
      description: "",
      rules: "",
    },
  });

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a tournament.");
      return;
    }

    setIsSubmitting(true);
    try {
      // If game is 'other' and otherGameDescription is empty, show error
      if (data.game === 'other' && !data.otherGameDescription?.trim()) {
        form.setError("otherGameDescription", {
          type: "manual",
          message: "Please specify the 'Other' game.",
        });
        toast.error("Please specify the 'Other' game.");
        setIsSubmitting(false); // Reset loading state on validation error
        return;
      }

      const newTournamentData = {
        ...data,
        // Use otherGameDescription as the actual game if 'other' is selected
        game: data.game === 'other' && data.otherGameDescription 
              ? data.otherGameDescription 
              : data.game,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName,
        status: "Open", // Default status
        registeredTeams: [], // Initialize as empty array
        standings: [], // Initialize as empty array
        winners: [], // Initialize as empty array
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TOURNAMENTS_COLLECTION_ID,
        ID.unique(),
        newTournamentData
      );

      toast.success(`Tournament "${data.name}" posted successfully!`);
      onTournamentPosted();
      form.reset();
    } catch (error: any) {
      console.error("Error posting tournament:", error);
      toast.error(error.message || "Failed to post tournament.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedGame = form.watch("game");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Tournament Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Campus Clash Valorant" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger className="bg-input text-foreground border-border focus:ring-ring focus:border-ring">
                    <SelectValue placeholder="Select a game" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-popover text-popover-foreground border-border">
                  {GAME_OPTIONS.map((option) => (
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
        {selectedGame === 'other' && (
          <FormField
            control={form.control}
            name="otherGameDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Specify Other Game</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Chess, FIFA 24" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-foreground">Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal bg-input text-foreground border-border focus:ring-ring focus:border-ring",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={isSubmitting}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover text-popover-foreground border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                    disabled={(date) =>
                      date < new Date() || date < new Date("1900-01-01")
                    }
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
          name="fee"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Registration Fee (₹)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 100" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
              <FormLabel className="text-foreground">Prize Pool</FormLabel>
              <FormControl>
                <Input placeholder="e.g., ₹5000, Gaming Headset" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="minPlayers"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Min Players per Team</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 1" {...field} onChange={e => field.onChange(parseInt(e.target.value))} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="maxPlayers"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">Max Players per Team</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 5" {...field} onChange={e => field.onChange(parseInt(e.target.value))} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the tournament, format, etc." {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="rules"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Rules</FormLabel>
              <FormControl>
                <Textarea placeholder="List out the rules for the tournament..." {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><PlusCircle className="mr-2 h-4 w-4" /> Post Tournament</>}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default PostTournamentForm;