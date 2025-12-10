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
import { Loader2, Save, PlusCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Tournament, useTournamentData } from "@/hooks/useTournamentData"; // Import Tournament and useTournamentData

// Define the form schema using Zod
const formSchema = z.object({
  name: z.string().min(1, "Tournament name is required."),
  game: z.string().min(1, "Game name is required."),
  date: z.date({
    required_error: "A date for the tournament is required.",
  }),
  fee: z.coerce.number().min(0, "Fee cannot be negative."),
  prizePool: z.string().min(1, "Prize pool details are required."),
  minPlayers: z.coerce.number().min(1, "Minimum players must be at least 1."),
  maxPlayers: z.coerce.number().min(1, "Maximum players must be at least 1."),
  description: z.string().min(1, "Description is required."),
  rules: z.string().min(1, "Rules are required."),
  status: z.enum(["Open", "Ongoing", "Completed", "Closed"], {
    required_error: "Status is required.",
  }),
  registeredTeams: z.array(z.string()).optional(), // Array of team names
});

export type TournamentUpdateData = z.infer<typeof formSchema>;

interface TournamentManagementFormProps {
  tournament: Tournament;
  onClose: () => void;
}

const TournamentManagementForm: React.FC<TournamentManagementFormProps> = ({ tournament, onClose }) => {
  const { updateTournament } = useTournamentData(); // Assuming useTournamentData provides updateTournament
  const [isSaving, setIsSaving] = useState(false);
  const [currentRegisteredTeams, setCurrentRegisteredTeams] = useState<string[]>(tournament.registeredTeams || []);
  const [newTeamName, setNewTeamName] = useState("");

  const form = useForm<TournamentUpdateData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: tournament.name,
      game: tournament.game,
      date: new Date(tournament.date),
      fee: tournament.fee,
      prizePool: tournament.prizePool,
      minPlayers: tournament.minPlayers,
      maxPlayers: tournament.maxPlayers,
      description: tournament.description,
      rules: tournament.rules,
      status: tournament.status,
      registeredTeams: tournament.registeredTeams,
    },
  });

  useEffect(() => {
    setCurrentRegisteredTeams(tournament.registeredTeams || []);
  }, [tournament.registeredTeams]);

  const handleAddTeam = () => {
    if (newTeamName.trim() && !currentRegisteredTeams.includes(newTeamName.trim())) {
      setCurrentRegisteredTeams((prev) => [...prev, newTeamName.trim()]);
      setNewTeamName("");
    }
  };

  const handleRemoveTeam = (teamToRemove: string) => {
    setCurrentRegisteredTeams((prev) => prev.filter((team) => team !== teamToRemove));
  };

  const handleSubmit = async (data: TournamentUpdateData) => {
    setIsSaving(true);
    try {
      const updatedData = {
        ...data,
        date: format(data.date, "yyyy-MM-dd"),
        registeredTeams: JSON.stringify(currentRegisteredTeams), // Stringify for Appwrite
      };
      // Assuming updateTournament takes the tournament ID and the updated data
      // await updateTournament(tournament.$id, updatedData); // This function needs to be implemented in useTournamentData
      
      // For now, directly call Appwrite update
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TOURNAMENTS_COLLECTION_ID,
        tournament.$id,
        updatedData
      );

      toast.success("Tournament updated successfully!");
      onClose();
    } catch (error: any) {
      console.error("Error updating tournament:", error);
      toast.error(error.message || "Failed to update tournament.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Tournament Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={isSaving} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Input {...field} disabled={isSaving} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                        "w-full pl-3 text-left font-normal bg-input text-foreground border-border hover:bg-input",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={isSaving}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card text-card-foreground border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date("1900-01-01")}
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
                <Input type="number" {...field} disabled={isSaving} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Input {...field} disabled={isSaving} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <FormLabel className="text-foreground">Min Players/Team</FormLabel>
                <FormControl>
                  <Input type="number" {...field} disabled={isSaving} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <FormLabel className="text-foreground">Max Players/Team</FormLabel>
                <FormControl>
                  <Input type="number" {...field} disabled={isSaving} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Textarea {...field} disabled={isSaving} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
                <Textarea {...field} disabled={isSaving} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
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
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving}>
                <FormControl>
                  <SelectTrigger className="bg-input text-foreground border-border focus:ring-ring focus:border-ring">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-popover text-popover-foreground border-border">
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Ongoing">Ongoing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Registered Teams Management */}
        <FormItem>
          <FormLabel className="text-foreground">Registered Teams</FormLabel>
          <div className="flex space-x-2 mb-2">
            <Input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Add new team name"
              disabled={isSaving}
              className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
            />
            <Button type="button" onClick={handleAddTeam} disabled={isSaving || !newTeamName.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {currentRegisteredTeams.map((team) => (
              <div key={team} className="flex items-center justify-between p-2 bg-muted rounded-md text-muted-foreground">
                <span>{team}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveTeam(team)} disabled={isSaving}>
                  <XCircle className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </FormItem>

        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default TournamentManagementForm;