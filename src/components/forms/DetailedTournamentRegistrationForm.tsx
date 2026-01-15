"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const playerSchema = z.object({
  name: z.string().min(1, "Player name is required."),
  inGameId: z.string().min(1, "In-game ID is required."),
});

const formSchema = z.object({
  teamName: z.string().min(3, { message: "Team name must be at least 3 characters." }),
  contactEmail: z.string().email({ message: "Please enter a valid email address." }),
  players: z.array(playerSchema).min(1, "At least one player is required."),
});

interface DetailedTournamentRegistrationFormProps {
  tournamentName: string;
  gameName: string;
  fee: number;
  minPlayers: number;
  maxPlayers: number;
  onRegister: (data: z.infer<typeof formSchema>) => void;
  onCancel: () => void;
}

const DetailedTournamentRegistrationForm: React.FC<DetailedTournamentRegistrationFormProps> = ({
  tournamentName,
  gameName,
  fee,
  minPlayers,
  maxPlayers,
  onRegister,
  onCancel,
}) => {
  const [isRegistering, setIsRegistering] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamName: "",
      contactEmail: "",
      players: Array.from({ length: minPlayers }).map(() => ({ name: "", inGameId: "" })),
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "players",
  });

  const handleRegistrationSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsRegistering(true);
    try {
      // Here you would typically handle payment initiation if fee > 0
      // For this example, we'll assume payment is handled or not required.
      if (fee > 0) {
        toast.info(`Initiating payment for ₹${fee}. This is a placeholder.`);
        // In a real app, integrate with a payment gateway here.
        // If payment fails, return early.
      }

      await onRegister(data);
      toast.success(`Team "${data.teamName}" registered for ${tournamentName}!`);
      form.reset();
    } catch (error: any) {
      console.error("Error during registration:", error);
      toast.error(error.message || "Failed to register for tournament.");
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleRegistrationSubmit)} className="space-y-4">
        <div className="p-3 bg-muted/20 rounded-md border border-border">
          <h4 className="font-semibold text-foreground mb-2">Tournament Details</h4>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{tournamentName}</span> ({gameName})
          </p>
          <p className="text-sm text-muted-foreground">
            Fee: <span className="font-medium text-foreground">{fee === 0 ? "Free" : `₹${fee}`}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Players per team: <span className="font-medium text-foreground">{minPlayers} - {maxPlayers}</span>
          </p>
        </div>

        <FormField
          control={form.control}
          name="teamName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Team Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Campus Conquerors" {...field} disabled={isRegistering} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Contact Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="team@example.com" {...field} disabled={isRegistering} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3 border-t border-border pt-4">
          <h3 className="text-lg font-semibold text-foreground">Team Players ({fields.length}/{maxPlayers})</h3>
          {fields.map((item, index) => (
            <div key={item.id} className="flex items-end gap-2">
              <FormField
                control={form.control}
                name={`players.${index}.name`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-foreground">Player {index + 1} Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Player Name" {...field} disabled={isRegistering} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`players.${index}.inGameId`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-foreground">In-Game ID</FormLabel>
                    <FormControl>
                      <Input placeholder="In-Game ID" {...field} disabled={isRegistering} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {fields.length > minPlayers && (
                <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={isRegistering}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          {fields.length < maxPlayers && (
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ name: "", inGameId: "" })}
              disabled={isRegistering}
              className="w-full border-border text-primary-foreground hover:bg-muted"
            >
              <UserPlus className="mr-2 h-4 w-4" /> Add Player
            </Button>
          )}
          {form.formState.errors.players && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.players.message}</p>
          )}
        </div>

        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isRegistering} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
            Cancel
          </Button>
          <Button type="submit" disabled={isRegistering} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Register Team"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default DetailedTournamentRegistrationForm;