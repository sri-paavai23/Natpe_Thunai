"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Calendar, DollarSign, Users, Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import TournamentRegistrationForm from "@/components/forms/TournamentRegistrationForm.tsx"; // Import the new form with .tsx extension

interface Tournament {
  id: string;
  name: string;
  game: string;
  date: string;
  fee: number;
  prizePool: string;
  status: "Open" | "Closed";
}

interface TeamStanding {
  rank: number;
  teamName: string;
  status: "1st" | "2nd" | "Eliminated" | "Participating";
  points: number;
}

const dummyTournaments: Tournament[] = [
  { id: "t1", name: "Campus Clash Season 1", game: "Free Fire", date: "2024-11-15", fee: 50, prizePool: "₹5000", status: "Open" },
  { id: "t2", name: "PUBG Mobile Showdown", game: "PUBG Mobile", date: "2024-12-01", fee: 75, prizePool: "₹7500", status: "Open" },
  { id: "t3", name: "eFootball Championship", game: "eFootball", date: "2024-10-20", fee: 0, prizePool: "₹2000", status: "Closed" },
  { id: "t4", name: "RC Cricket 25 Cup", game: "RC Cricket 25", date: "2025-01-10", fee: 30, prizePool: "₹3000", status: "Open" },
];

const dummyWinners = [
  { tournament: "eFootball Championship", winner: "Team Elite", prize: "₹2000" },
];

const dummyStandings: TeamStanding[] = [
  { rank: 1, teamName: "Team Alpha", status: "1st", points: 1500 },
  { rank: 2, teamName: "Team Beta", status: "2nd", points: 1200 },
  { rank: 3, teamName: "Team Gamma", status: "Eliminated", points: 800 },
  { rank: 4, teamName: "Team Delta", status: "Eliminated", points: 600 },
  { rank: 5, teamName: "Team Epsilon", status: "Participating", points: 400 },
];

const TournamentPage = () => {
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  const handleRegisterClick = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setIsRegisterDialogOpen(true);
  };

  const handleRegistrationSubmit = (data: { teamName: string; contactEmail: string; numPlayers: string }) => {
    if (!selectedTournament) return;
    toast.success(`Successfully registered "${data.teamName}" for ${selectedTournament.name}!`);
    // In a real app, send data to backend, handle payment, etc.
    setIsRegisterDialogOpen(false);
  };

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
            {dummyTournaments.filter(t => t.status === "Open").map((tournament) => (
              <div key={tournament.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border border-border rounded-md bg-background">
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
            ))}
            {dummyTournaments.filter(t => t.status === "Open").length === 0 && (
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
            {dummyWinners.length > 0 ? (
              dummyWinners.map((winner, index) => (
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
                {dummyStandings.map((team) => (
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
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />

      {/* Registration Dialog */}
      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Register for {selectedTournament?.name}</DialogTitle>
          </DialogHeader>
          {selectedTournament && (
            <TournamentRegistrationForm
              tournamentName={selectedTournament.name}
              gameName={selectedTournament.game}
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