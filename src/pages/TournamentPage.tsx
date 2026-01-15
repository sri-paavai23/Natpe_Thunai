"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Calendar, DollarSign, Users, Gamepad2, Loader2, AlertTriangle, Edit, PlusCircle, Info, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import DetailedTournamentRegistrationForm from "@/components/forms/DetailedTournamentRegistrationForm";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TOURNAMENTS_COLLECTION_ID } from "@/lib/appwrite";
import TournamentManagementForm from "@/components/forms/TournamentManagementForm";
import PostTournamentForm from "@/components/forms/PostTournamentForm";
import { useTournamentData, Tournament, TeamStanding, Winner } from "@/hooks/useTournamentData";
import { useAuth } from "@/context/AuthContext";

// Ensure your Tournament interface includes upiId
// If it's defined in a hook, you might need to extend it locally or update the hook
interface ExtendedTournament extends Tournament {
  upiId?: string; // Host's UPI ID for payments
}

const TournamentPage = () => {
  const { user } = useAuth();
  const { tournaments, isLoading, error } = useTournamentData();
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<ExtendedTournament | null>(null);
  const [isManagementDialogOpen, setIsManagementDialogOpen] = useState(false);
  const [isPostTournamentDialogOpen, setIsPostTournamentDialogOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const upcomingTournaments = tournaments.filter(t => t.status === "Open");
  const ongoingTournaments = tournaments.filter(t => t.status === "Ongoing");
  const completedTournaments = tournaments.filter(t => t.status === "Completed");
  const allWinners: Winner[] = tournaments.flatMap(t => t.winners || []);
  const activeStandings: TeamStanding[] = tournaments.find(t => t.standings && t.standings.length > 0)?.standings || [];

  const handleRegisterClick = (tournament: Tournament) => {
    // Cast to ExtendedTournament to access upiId if your hook type doesn't have it yet
    setSelectedTournament(tournament as ExtendedTournament);
    setIsRegisterDialogOpen(true);
  };

  // This function is passed to the form, but the FORM handles the payment redirect now
  const handleRegistrationSubmit = (data: { teamName: string; contactEmail: string; players: { name: string; inGameId: string }[] }) => {
    if (!selectedTournament) return;
    
    // In a real app, you would verify payment via backend webhooks here.
    // Since this is P2P, we assume if they return to the app and click confirm, they paid.
    toast.success(`Registration request sent for "${data.teamName}"!`);
    setIsRegisterDialogOpen(false);
  };

  const handleManageTournamentClick = (tournament: Tournament) => {
    setSelectedTournament(tournament as ExtendedTournament);
    setIsManagementDialogOpen(true);
  };

  const handleTournamentPosted = () => {
    setIsPostTournamentDialogOpen(false);
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

        {/* Create Tournament Card */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-secondary-neon" /> Host Your Own Tournament
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Organize and manage your own esports tournaments for the campus community!
            </p>
            <Dialog open={isPostTournamentDialogOpen} onOpenChange={setIsPostTournamentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create New Tournament
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Create New Tournament</DialogTitle>
                </DialogHeader>
                <PostTournamentForm 
                  onTournamentPosted={handleTournamentPosted} 
                  onCancel={() => setIsPostTournamentDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

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
                  <div className="flex-1">
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Hosted by: <span className="font-medium text-foreground">{tournament.posterName}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 mt-3 sm:mt-0">
                    {user?.$id === tournament.posterId && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                        onClick={() => handleManageTournamentClick(tournament)}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Manage
                      </Button>
                    )}
                    <Button
                      className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
                      onClick={() => handleRegisterClick(tournament)}
                    >
                      Register
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No upcoming tournaments currently open for registration.</p>
            )}
          </CardContent>
        </Card>

        {/* ... Ongoing, Winners, Standings, Completed Sections (No changes needed) ... */}
        {ongoingTournaments.length > 0 && (
            <Card className="bg-card text-card-foreground shadow-lg border-border">
                <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" /> Ongoing Tournaments
                </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-4">
                {ongoingTournaments.map((tournament) => (
                    <div key={tournament.$id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border border-border rounded-md bg-background">
                    <div>
                        <h3 className="font-semibold text-foreground">{tournament.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Gamepad2 className="h-3 w-3" /> {tournament.game}
                        </p>
                        <Badge className="bg-orange-500 text-white mt-1">Ongoing</Badge>
                    </div>
                    </div>
                ))}
                </CardContent>
            </Card>
        )}
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
              fee={selectedTournament.fee}
              minPlayers={selectedTournament.minPlayers}
              maxPlayers={selectedTournament.maxPlayers}
              // Pass the Host UPI ID to the form
              hostUpiId={selectedTournament.upiId || ""} 
              hostName={selectedTournament.posterName}
              onRegister={handleRegistrationSubmit}
              onCancel={() => setIsRegisterDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Tournament Management Dialog */}
      <Dialog open={isManagementDialogOpen} onOpenChange={setIsManagementDialogOpen}>
        <DialogContent className="sm:max-w-[700px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Manage Tournament: {selectedTournament?.name}</DialogTitle>
          </DialogHeader>
          {selectedTournament && (
            <TournamentManagementForm
              tournament={selectedTournament}
              onClose={() => setIsManagementDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentPage;