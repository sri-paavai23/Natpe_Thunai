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
import { Loader2, Save, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Tournament, TeamStanding, Winner } from "@/hooks/useTournamentData";

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
  status: z.enum(["upcoming", "active", "completed", "cancelled"]),
  standings: z.array(z.object({
    teamName: z.string().min(1, "Team name is required"),
    points: z.number().min(0, "Points must be non-negative"),
    rank: z.number().min(1, "Rank must be at least 1"),
  })).optional(),
  winners: z.array(z.object({
    position: z.number().min(1, "Position must be at least 1"),
    name: z.string().min(1, "Winner name is required"),
    prize: z.string().optional(),
  })).optional(),
}).refine(data => new Date(data.endDate) >= new Date(data.startDate), {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

interface TournamentManagementFormProps {
  tournament: Tournament;
  onSubmit: (data: Partial<Tournament>) => Promise<void>;
  onCancel: () => void;
}

const TournamentManagementForm: React.FC<TournamentManagementFormProps> = ({ tournament, onSubmit, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: tournament.title,
      description: tournament.description,
      game: tournament.game,
      platform: tournament.platform,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      registrationLink: tournament.registrationLink,
      prizePool: tournament.prizePool || "",
      rulesLink: tournament.rulesLink || "",
      maxParticipants: tournament.maxParticipants || undefined,
      status: tournament.status,
      standings: tournament.standings || [],
      winners: tournament.winners || [],
    },
  });

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      toast.success("Tournament updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update tournament.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addStanding = () => {
    const currentStandings = form.getValues("standings") || [];
    form.setValue("standings", [...currentStandings, { teamName: "", points: 0, rank: currentStandings.length + 1 }]);
  };

  const removeStanding = (index: number) => {
    const currentStandings = form.getValues("standings") || [];
    form.setValue("standings", currentStandings.filter((_, i) => i !== index));
  };

  const addWinner = () => {
    const currentWinners = form.getValues("winners") || [];
    form.setValue("winners", [...currentWinners, { position: currentWinners.length + 1, name: "", prize: "" }]);
  };

  const removeWinner = (index: number) => {
    const currentWinners = form.getValues("winners") || [];
    form.setValue("winners", currentWinners.filter((_, i) => i !== index));
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
          name="game"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Game</FormLabel>
              <FormControl>
                <Input {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Input {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Input type="url" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Input {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Input type="url" {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Input type="number" {...field} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger className="bg-input text-foreground border-border focus:ring-ring focus:border-ring">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-popover text-popover-foreground border-border">
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Team Standings Section */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Team Standings</h3>
          {form.watch("standings")?.map((standing, index) => (
            <div key={index} className="flex gap-2 mb-2 items-end">
              <FormField
                control={form.control}
                name={`standings.${index}.teamName`}
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel className="text-foreground">Team Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} className="bg-input text-foreground border-border" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`standings.${index}.points`}
                render={({ field }) => (
                  <FormItem className="w-24">
                    <FormLabel className="text-foreground">Points</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} disabled={isSubmitting} className="bg-input text-foreground border-border" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`standings.${index}.rank`}
                render={({ field }) => (
                  <FormItem className="w-20">
                    <FormLabel className="text-foreground">Rank</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} disabled={isSubmitting} className="bg-input text-foreground border-border" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" variant="destructive" size="icon" onClick={() => removeStanding(index)} disabled={isSubmitting}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addStanding} disabled={isSubmitting} className="mt-2">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Standing
          </Button>
        </div>

        {/* Winners Section */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Winners</h3>
          {form.watch("winners")?.map((winner, index) => (
            <div key={index} className="flex gap-2 mb-2 items-end">
              <FormField
                control={form.control}
                name={`winners.${index}.position`}
                render={({ field }) => (
                  <FormItem className="w-20">
                    <FormLabel className="text-foreground">Position</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} disabled={isSubmitting} className="bg-input text-foreground border-border" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`winners.${index}.name`}
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel className="text-foreground">Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} className="bg-input text-foreground border-border" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`winners.${index}.prize`}
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel className="text-foreground">Prize (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} className="bg-input text-foreground border-border" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" variant="destructive" size="icon" onClick={() => removeWinner(index)} disabled={isSubmitting}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addWinner} disabled={isSubmitting} className="mt-2">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Winner
          </Button>
        </div>

        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default TournamentManagementForm;