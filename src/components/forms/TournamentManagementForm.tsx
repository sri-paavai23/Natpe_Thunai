"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2, Save, PlusCircle, Trash2, Users, Trophy } from "lucide-react";
import { toast } from "sonner";
import { useTournamentData, Tournament, TeamStanding, Winner } from "@/hooks/useTournamentData";
// --- FIXED IMPORTS HERE ---
import { databases, APPWRITE_DATABASE_ID, APPWRITE_REGISTRATIONS_COLLECTION_ID, Query } from "@/lib/appwrite";

// --- EXISTING SCHEMAS ---
const teamStandingSchema = z.object({
  rank: z.preprocess((val) => Number(val), z.number().min(1, "Rank must be at least 1.")),
  teamName: z.string().min(1, "Team name is required."),
  status: z.enum(["1st", "2nd", "Eliminated", "Participating"]),
  points: z.preprocess((val) => Number(val), z.number().min(0, "Points cannot be negative.")),
});

const winnerSchema = z.object({
  tournament: z.string().min(1, "Tournament name is required."),
  winner: z.string().min(1, "Winner name is required."),
  prize: z.string().min(1, "Prize details are required."),
});

const formSchema = z.object({
  status: z.enum(["Open", "Ongoing", "Completed", "Closed"]),
  standings: z.array(teamStandingSchema),
  winners: z.array(winnerSchema),
});

interface TournamentManagementFormProps {
  tournament: Tournament;
  onClose: () => void;
}

const TournamentManagementForm: React.FC<TournamentManagementFormProps> = ({ tournament, onClose }) => {
  const { updateTournament } = useTournamentData();
  const [isSaving, setIsSaving] = useState(false);
  
  // New state for tab switching
  const [activeTab, setActiveTab] = useState<"details" | "registrations">("details");
  const [registeredTeams, setRegisteredTeams] = useState<any[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  // --- FORM SETUP ---
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: tournament.status,
      standings: tournament.standings || [],
      winners: tournament.winners || [],
    },
  });

  const { fields: standingsFields, append: appendStanding, remove: removeStanding } = useFieldArray({
    control: form.control,
    name: "standings",
  });

  const { fields: winnersFields, append: appendWinner, remove: removeWinner } = useFieldArray({
    control: form.control,
    name: "winners",
  });

  // --- FETCH REGISTRATIONS LOGIC ---
  useEffect(() => {
    if (activeTab === "registrations") {
      const fetchTeams = async () => {
        setLoadingTeams(true);
        try {
          const res = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_REGISTRATIONS_COLLECTION_ID, // Now uses the real ID from appwrite.ts
            [
              // Make sure you have an Index in Appwrite named 'tournament_idx' (or anything) 
              // on the attribute 'tournamentId' for this to work.
              Query.equal("registrations", tournament.$id)
            ]
          );
          setRegisteredTeams(res.documents);
        } catch (error: any) {
          console.error("Error fetching teams:", error);
          // Show the specific error to help debugging
          toast.error("Failed to load teams: " + error.message);
        } finally {
          setLoadingTeams(false);
        }
      };
      fetchTeams();
    }
  }, [activeTab, tournament.$id]);

  // --- SAVE HANDLER ---
  const handleSave = async (data: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    try {
      const dataToUpdate: Partial<Tournament> = {
        status: data.status,
        standings: data.standings as TeamStanding[],
        winners: data.winners as Winner[],
      };
      await updateTournament(tournament.$id, dataToUpdate);
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
    <div className="space-y-4">
      {/* Custom Tabs UI */}
      <div className="flex space-x-2 border-b border-border pb-2">
        <Button
          variant={activeTab === "details" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("details")}
          className={activeTab === "details" ? "bg-secondary-neon text-primary-foreground" : ""}
        >
          <Trophy className="w-4 h-4 mr-2" /> Tournament Details
        </Button>
        <Button
          variant={activeTab === "registrations" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("registrations")}
          className={activeTab === "registrations" ? "bg-secondary-neon text-primary-foreground" : ""}
        >
          <Users className="w-4 h-4 mr-2" /> Registered Teams
        </Button>
      </div>

      {activeTab === "details" ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
            {/* Status Field */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Tournament Status</FormLabel>
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

            {/* Standings Section */}
            <div className="space-y-4 border-t border-border pt-4">
              <h3 className="text-lg font-semibold text-foreground">Team Standings</h3>
              {standingsFields.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end p-2 border border-border rounded-md bg-background">
                  <FormField
                    control={form.control}
                    name={`standings.${index}.rank`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Rank</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} disabled={isSaving} className="bg-input text-foreground border-border" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`standings.${index}.teamName`}
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-foreground">Team Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSaving} className="bg-input text-foreground border-border" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`standings.${index}.status`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSaving}>
                          <FormControl>
                            <SelectTrigger className="bg-input text-foreground border-border">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover text-popover-foreground border-border">
                            <SelectItem value="1st">1st</SelectItem>
                            <SelectItem value="2nd">2nd</SelectItem>
                            <SelectItem value="Eliminated">Eliminated</SelectItem>
                            <SelectItem value="Participating">Participating</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`standings.${index}.points`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground">Points</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} disabled={isSaving} className="bg-input text-foreground border-border" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="destructive" size="icon" onClick={() => removeStanding(index)} disabled={isSaving} className="mt-auto">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => appendStanding({ rank: standingsFields.length + 1, teamName: "", status: "Participating", points: 0 })} disabled={isSaving} className="w-full border-border text-primary-foreground hover:bg-muted">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Team Standing
              </Button>
            </div>

            {/* Winners Section */}
            <div className="space-y-4 border-t border-border pt-4">
              <h3 className="text-lg font-semibold text-foreground">Winner Announcements</h3>
              {winnersFields.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end p-2 border border-border rounded-md bg-background">
                  <FormField
                    control={form.control}
                    name={`winners.${index}.tournament`}
                    render={({ field }) => (
                      <FormItem className="col-span-1">
                        <FormLabel className="text-foreground">Tournament</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSaving} className="bg-input text-foreground border-border" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`winners.${index}.winner`}
                    render={({ field }) => (
                      <FormItem className="col-span-1">
                        <FormLabel className="text-foreground">Winner</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSaving} className="bg-input text-foreground border-border" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`winners.${index}.prize`}
                    render={({ field }) => (
                      <FormItem className="col-span-1">
                        <FormLabel className="text-foreground">Prize</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSaving} className="bg-input text-foreground border-border" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="destructive" size="icon" onClick={() => removeWinner(index)} disabled={isSaving} className="mt-auto">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => appendWinner({ tournament: tournament.name, winner: "", prize: "" })} disabled={isSaving} className="w-full border-border text-primary-foreground hover:bg-muted">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Winner
              </Button>
            </div>

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
      ) : (
        // --- REGISTRATIONS TAB CONTENT ---
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Registered Teams ({registeredTeams.length})</h3>
          </div>
          
          {loadingTeams ? (
             <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-secondary-neon"/></div>
          ) : registeredTeams.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">No teams registered yet.</div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {registeredTeams.map((team) => (
                <div key={team.$id} className="p-3 border border-border rounded-md bg-muted/20">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-foreground">{team.teamName}</h4>
                      <p className="text-sm text-muted-foreground">{team.contactEmail}</p>
                    </div>
                  </div>
                  
                  <div className="bg-background p-2 rounded border border-border">
                    <p className="text-xs font-semibold mb-1 text-muted-foreground">ROSTER:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {(() => {
                        try {
                          // Handle case where players is already an object or a string
                          const roster = typeof team.players === 'string' ? JSON.parse(team.players || "[]") : team.players;
                          return Array.isArray(roster) ? roster.map((p: any, i: number) => (
                            <div key={i} className="text-xs flex justify-between bg-muted px-2 py-1 rounded">
                              <span>{p.name}</span>
                              <span className="font-mono text-muted-foreground">{p.inGameId}</span>
                            </div>
                          )) : null;
                        } catch (e) {
                          return <span className="text-xs text-destructive">Error parsing roster data</span>;
                        }
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <DialogFooter className="pt-2">
             <Button variant="outline" onClick={onClose} className="w-full border-border">Close</Button>
          </DialogFooter>
        </div>
      )}
    </div>
  );
};

export default TournamentManagementForm;