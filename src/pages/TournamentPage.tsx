"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Calendar, DollarSign, Users, Gamepad2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import DetailedTournamentRegistrationForm from "@/components/forms/DetailedTournamentRegistrationForm";
import { useTournamentData, Tournament, TeamStanding, Winner } from "@/hooks/useTournamentData"; // Import hook and interfaces

const TournamentPage = () => {
  const { tournaments, isLoading, error } = useTournamentData();
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  // Aggregate data from all tournaments
  const upcomingTournaments = tournaments.filter(t => t.status === "Open");
  
  // Aggregate all winners from all tournaments
  const allWinners: Winner[] = tournaments.flatMap(t => t.winners || []);
  
  // Aggregate all standings (assuming standings are for the most recent/active tournament)
  // For simplicity, we'll display standings from the first tournament that has them, or an empty array.
  const activeStandings: TeamStanding[] = tournaments.find(t => t.standings && t.standings.length > 0)?.standings || [];


  const handleRegisterClick = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setIsRegisterDialogOpen(true);
  };

  const handleRegistrationSubmit = (data: { teamName: string; contactEmail: string; players: { name: string; inGameId: string }[] }) => {
    if (!selectedTournament) return;
    // The payment initiation is now handled inside the form before calling onRegister.
    // If onRegister is called, we assume payment initiation was successful (or fee was zero).
    toast.success(`Successfully registered "${data.teamName}" (${data.players.length} players) for ${selectedTournament.name}!`);
    // Reset form state if needed, but closing the dialog handles it.
    setIsRegisterDialogOpen(false);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <AlertTriangle className="h-6 w-6 text-destructive mr-2" />
        <p className="text-lg text-destructive">Error loading tournaments: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Esports Arena (Tournaments)</h1>
      <div className="max-w-md mx-auto space-y-6">

        {/* Upcoming Tournaments Section */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-secondary-neon" /> Upcoming Tournaments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading tournaments...</p>
              </div>
            ) : upcomingTournaments.length > 0 ? (
              upcomingTournaments.map((tournament) => (
                <div key={tournament.$id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border border-border rounded-md bg-background">
                  <div>
                    <h3 className="font-semibold text-foreground">{tournament.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Gamepad2 className="h-3 w-3" /> {tournament.game}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {tournament.date}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Fee: {tournament.fee === 0 ? "Free" : `₹${tournament.fee}`} | Prize: {tournament.prizePool}
                    </p>
                  </div>
                  <Button
                    className="mt-3 sm:mt-0 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
                    onClick={() => handleRegisterClick(tournament)}
                  >
                    Register
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No upcoming tournaments currently open for registration.</p>
            )}
          </CardContent>
        </Card>

        {/* Winner Announcements Section */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Trophy className="h-5 w-5 text-secondary-neon" /> Winner Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-4">Loading winners...</p>
            ) : allWinners.length > 0 ? (
              allWinners.map((winner, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                  <p className="text-foreground font-medium">{winner.tournament}</p>
                  <p className="text-muted-foreground">Winner: <span className="font-semibold text-secondary-neon">{winner.winner}</span> (Prize: {winner.prize})</p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No winners announced yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Tournament Standings / Team Table Section */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary-neon" /> Tournament Standings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-4">Loading standings...</p>
            ) : activeStandings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px] text-foreground">Rank</TableHead>
                    <TableHead className="text-foreground">Team Name</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-right text-foreground">Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeStandings.map((team) => (
                    <TableRow key={team.rank}>
                      <TableCell className="font-medium text-foreground">{team.rank}</TableCell>
                      <TableCell className="text-foreground">{team.teamName}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "px-2 py-1 text-xs font-semibold",
                            team.status === "1st" && "bg-secondary-neon text-primary-foreground",
                            team.status === "2nd" && "bg-blue-500 text-white",
                            team.status === "Eliminated" && "bg-destructive text-destructive-foreground",
                            team.status === "Participating" && "bg-muted text-muted-foreground"
                          )}
                        >
                          {team.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-foreground">{team.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">No active tournament standings available.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />

      {/* Registration Dialog */}
      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Register for {selectedTournament?.name}</DialogTitle>
          </DialogHeader>
          {selectedTournament && (
            <DetailedTournamentRegistrationForm
              tournamentName={selectedTournament.name}
              gameName={selectedTournament.game}
              fee={selectedTournament.fee} // Pass the fee
              onRegister={handleRegistrationSubmit}
              onCancel={() => setIsRegisterDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentPage;