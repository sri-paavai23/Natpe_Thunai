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
import { Loader2, PlusCircle, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TOURNAMENTS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import DeletionInfoMessage from "@/components/DeletionInfoMessage";

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
  otherGameDescription: z.string().optional(),
  date: z.string().min(1, { message: "Date is required." }),
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
  transactionId: z.string().optional(), // Added for UPI transaction ID
});

interface PostTournamentFormProps {
  onTournamentPosted: () => void;
  onCancel: () => void;
}

const PostTournamentForm: React.FC<PostTournamentFormProps> = ({ onTournamentPosted, onCancel }) => {
  const { user, userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'form' | 'paymentInitiated'>('form');
  const [calculatedCommission, setCalculatedCommission] = useState<number>(0);

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
      transactionId: "",
    },
  });

  const finalizeTournamentSubmission = async (data: z.infer<typeof formSchema>, commission: number, transactionId: string) => {
    try {
      const newTournamentData = {
        ...data,
        game: data.game === 'other' && data.otherGameDescription
              ? data.otherGameDescription
              : data.game,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName,
        status: "Open",
        registeredTeams: [],
        standings: [],
        winners: [],
        commissionAmount: commission, // Store commission amount
        paymentTransactionId: transactionId, // Store transaction ID
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
      setPaymentStep('form'); // Reset payment step
      setCalculatedCommission(0); // Reset commission
    } catch (error: any) {
      console.error("Error posting tournament:", error);
      toast.error(error.message || "Failed to post tournament.");
      throw error; // Re-throw to be caught by the outer try-catch
    }
  };

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a tournament.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Validate initial form fields and initiate payment
      if (paymentStep === 'form') {
        // Basic validation for the first step
        const result = formSchema.pick({
          name: true, game: true, otherGameDescription: true, date: true, fee: true,
          prizePool: true, minPlayers: true, maxPlayers: true, description: true, rules: true
        }).safeParse(data);

        if (!result.success) {
          toast.error("Please fill in all required tournament details.");
          setIsSubmitting(false);
          return;
        }

        // If game is 'other' and otherGameDescription is empty, show error
        if (data.game === 'other' && !data.otherGameDescription?.trim()) {
          form.setError("otherGameDescription", {
            type: "manual",
            message: "Please specify the 'Other' game.",
          });
          toast.error("Please specify the 'Other' game.");
          setIsSubmitting(false);
          return;
        }

        // Calculate commission
        const prizePoolValue = parseFloat(data.prizePool.replace(/[^0-9.]/g, '')) || 0;
        // Placeholder for dynamic commission based on user level.
        // For simplicity, let's use a fixed 5% for now.
        // In a real app, userProfile.level would determine the rate.
        const commissionRate = 0.05; // 5% commission
        const commission = prizePoolValue * commissionRate;

        if (commission <= 0) {
          toast.info("No commission required for this prize pool. Proceeding to post tournament.");
          // If no commission, skip payment step and proceed directly to posting
          setCalculatedCommission(0);
          await finalizeTournamentSubmission(data, 0, ""); // No transaction ID
          return;
        }

        setCalculatedCommission(commission);

        // Generate UPI deep link
        // IMPORTANT: Replace with your actual developer UPI ID and name
        const developerUpiId = "yourdeveloperupi@bank"; 
        const developerName = "Tournament Organizers"; 
        const transactionNote = encodeURIComponent(`Commission for ${data.name}`);
        const upiLink = `upi://pay?pa=${developerUpiId}&pn=${developerName}&am=${commission.toFixed(2)}&cu=INR&tn=${transactionNote}`;

        // Redirect to UPI app
        window.location.href = upiLink;

        setPaymentStep('paymentInitiated');
        toast.info(`Please complete the payment of ₹${commission.toFixed(2)} via your UPI app and then enter the transaction ID.`);
        setIsSubmitting(false); // Allow user to interact with the form again to enter transaction ID
      }
      // Step 2: Submit tournament with transaction ID
      else if (paymentStep === 'paymentInitiated') {
        // Validate transaction ID
        if (!data.transactionId || data.transactionId.trim().length === 0) {
          form.setError("transactionId", {
            type: "manual",
            message: "Transaction ID is required after payment.",
          });
          toast.error("Please enter the transaction ID.");
          setIsSubmitting(false);
          return;
        }
        
        await finalizeTournamentSubmission(data, calculatedCommission, data.transactionId);
      }
    } catch (error: any) {
      console.error("Error in tournament posting process:", error);
      toast.error(error.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedGame = form.watch("game");

  const handleCancel = () => {
    form.reset();
    setPaymentStep('form');
    setCalculatedCommission(0);
    onCancel();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <DeletionInfoMessage />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Tournament Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Campus Clash Valorant" {...field} disabled={isSubmitting || paymentStep === 'paymentInitiated'} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting || paymentStep === 'paymentInitiated'}>
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
                  <Input placeholder="e.g., Chess, FIFA 24" {...field} disabled={isSubmitting || paymentStep === 'paymentInitiated'} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                      disabled={isSubmitting || paymentStep === 'paymentInitiated'}
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
                <Input type="number" placeholder="e.g., 100" {...field} disabled={isSubmitting || paymentStep === 'paymentInitiated'} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Input placeholder="e.g., ₹5000, Gaming Headset" {...field} disabled={isSubmitting || paymentStep === 'paymentInitiated'} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                  <Input type="number" placeholder="e.g., 1" {...field} onChange={e => field.onChange(parseInt(e.target.value))} disabled={isSubmitting || paymentStep === 'paymentInitiated'} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                  <Input type="number" placeholder="e.g., 5" {...field} onChange={e => field.onChange(parseInt(e.target.value))} disabled={isSubmitting || paymentStep === 'paymentInitiated'} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Textarea placeholder="Describe the tournament, format, etc." {...field} disabled={isSubmitting || paymentStep === 'paymentInitiated'} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Textarea placeholder="List out the rules for the tournament..." {...field} disabled={isSubmitting || paymentStep === 'paymentInitiated'} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {paymentStep === 'paymentInitiated' && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Please complete the payment of ₹{calculatedCommission.toFixed(2)} using your UPI app.
              Once done, enter the transaction ID below to finalize your tournament post.
            </p>
            <FormField
              control={form.control}
              name="transactionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">UPI Transaction ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter UPI Transaction ID" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
              <>
                {paymentStep === 'form' ? (
                  <><PlusCircle className="mr-2 h-4 w-4" /> Proceed to Payment</>
                ) : (
                  <><PlusCircle className="mr-2 h-4 w-4" /> Post Tournament</>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default PostTournamentForm;