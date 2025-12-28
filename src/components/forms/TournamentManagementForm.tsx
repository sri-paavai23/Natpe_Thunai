import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useTournamentData, Tournament, TeamStanding, Winner, TournamentStatus } from "@/hooks/useTournamentData"; // Import TournamentStatus

const formSchema = z.object({
  status: z.enum(["Open", "Ongoing", "Completed", "Closed"]), // Use TournamentStatus
  standings: z.array(
    z.object({
      teamName: z.string().min(1, "Team name is required"),
      score: z.coerce.number().min(0, "Score cannot be negative"),
      rank: z.coerce.number().min(1, "Rank must be at least 1"),
    })
  ),
  winners: z.array(
    z.object({
      tournamentId: z.string(), // Hidden field, will be set programmatically
      winnerTeamName: z.string().min(1, "Winner team name is required"),
      prize: z.string().min(1, "Prize is required"),
    })
  ),
});

interface TournamentManagementFormProps {
  tournament: Tournament;
  onClose: () => void;
}

const TournamentManagementForm: React.FC<TournamentManagementFormProps> = ({ tournament, onClose }) => {
  const { updateTournament } = useTournamentData();
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: tournament.status,
      standings: tournament.standings || [],
      winners: tournament.winners || [],
    },
  });

  const { fields: standingFields, append: appendStanding, remove: removeStanding } = useFieldArray({
    control: form.control,
    name: "standings",
  });

  const { fields: winnerFields, append: appendWinner, remove: removeWinner } = useFieldArray({
    control: form.control,
    name: "winners",
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    try {
      const dataToUpdate: Partial<Tournament> = {
        status: data.status,
        standings: data.standings as TeamStanding[],
        winners: data.winners.map(w => ({ ...w, tournamentId: tournament.$id })) as Winner[], // Ensure tournamentId is set
      };
      await updateTournament(tournament.$id, dataToUpdate);
      toast.success("Tournament updated successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to update tournament.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tournament Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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

        <div>
          <h3 className="text-lg font-semibold mb-2">Standings</h3>
          {standingFields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-2 mb-2">
              <FormField
                control={form.control}
                name={`standings.${index}.teamName`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`standings.${index}.score`}
                render={({ field }) => (
                  <FormItem className="w-24">
                    <FormLabel>Score</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`standings.${index}.rank`}
                render={({ field }) => (
                  <FormItem className="w-24">
                    <FormLabel>Rank</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" variant="destructive" onClick={() => removeStanding(index)} disabled={isSaving}>
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => appendStanding({ teamName: "", score: 0, rank: 0 })}
            disabled={isSaving}
          >
            Add Standing
          </Button>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Winners</h3>
          {winnerFields.map((field, index) => (
            <div key={field.id} className="flex items-end gap-2 mb-2">
              <FormField
                control={form.control}
                name={`winners.${index}.winnerTeamName`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Winner Team Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`winners.${index}.prize`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Prize</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" variant="destructive" onClick={() => removeWinner(index)} disabled={isSaving}>
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => appendWinner({ tournamentId: tournament.$id, winnerTeamName: "", prize: "" })} // Use tournament.$id
            disabled={isSaving}
          >
            Add Winner
          </Button>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TournamentManagementForm;