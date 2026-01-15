"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Gamepad2, Hammer, ChevronLeft, Cpu } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TournamentPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-secondary-neon/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      <div className="max-w-md w-full space-y-8 text-center relative z-10">
        
        {/* Animated Icon */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 bg-secondary-neon/20 rounded-full animate-ping opacity-75"></div>
            <div className="relative bg-card border-2 border-secondary-neon p-4 rounded-full shadow-[0_0_30px_rgba(0,243,255,0.3)]">
                <Gamepad2 className="h-10 w-10 text-secondary-neon" />
                <Hammer className="h-5 w-5 text-foreground absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 border border-border" />
            </div>
        </div>

        <div className="space-y-2">
            <h1 className="text-4xl font-black italic tracking-tighter">
                RESPAWNING <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-neon to-cyan-400">SOON</span>
            </h1>
            <p className="text-muted-foreground text-lg">
                The Arena is currently <span className="font-mono text-secondary-neon">AFK</span> for critical upgrades.
            </p>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-secondary-neon/30 border-dashed">
            <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3 text-left">
                    <Cpu className="h-5 w-5 text-secondary-neon mt-1 shrink-0" />
                    <div>
                        <h3 className="font-semibold text-foreground">System Upgrade in Progress</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            We are recalibrating the matchmaking brackets and squashing some bugs to ensure fair play.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
            <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="group border-secondary-neon/50 hover:bg-secondary-neon/10 hover:text-secondary-neon hover:border-secondary-neon"
            >
                <ChevronLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Go Back
            </Button>
            <Button disabled className="bg-muted text-muted-foreground cursor-not-allowed">
                Join Waitlist
            </Button>
        </div>

      </div>

      <div className="absolute bottom-4 w-full">
         <MadeWithDyad />
      </div>
    </div>
  );
};

export default TournamentPage;


/* // ==========================================
//      ORIGINAL CODE (COMMENTED OUT)
// ==========================================

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

const TournamentPage = () => {
  const { user } = useAuth();
  const { tournaments, isLoading, error } = useTournamentData();
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
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
    setSelectedTournament(tournament);
    setIsRegisterDialogOpen(true);
  };

  const handleRegistrationSubmit = (data: { teamName: string; contactEmail: string; players: { name: string; inGameId: string }[] }) => {
    if (!selectedTournament) return;
    toast.success(`Successfully registered "${data.teamName}"!`);
    setIsRegisterDialogOpen(false);
  };

  const handleManageTournamentClick = (tournament: Tournament) => {
    setSelectedTournament(tournament);
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

        // Create Tournament Card
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

        // Upcoming Tournaments Section
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
                    <p className="text-xs text-muted-foreground mt-1">
                      Hosted by: <span className="font-medium text-foreground">{tournament.posterName}</span>
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3" /> Players per team: {tournament.minPlayers}-{tournament.maxPlayers}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Info className="h-3 w-3" /> {tournament.description}
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

        // Ongoing Tournaments Section
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
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {tournament.date}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hosted by: <span className="font-medium text-foreground">{tournament.posterName}</span>
                    </p>
                  </div>
                  <Badge className="bg-orange-500 text-white mt-3 sm:mt-0">Ongoing</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        // Winner Announcements Section
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

        // Tournament Standings / Team Table Section
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

        // Completed Tournaments Section
        {completedTournaments.length > 0 && (
          <Card className="bg-card text-card-foreground shadow-lg border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                <Trophy className="h-5 w-5 text-green-500" /> Past Tournaments
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              {completedTournaments.map((tournament) => (
                <div key={tournament.$id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border border-border rounded-md bg-background">
                  <div>
                    <h3 className="font-semibold text-foreground">{tournament.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Gamepad2 className="h-3 w-3" /> {tournament.game}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {tournament.date}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hosted by: <span className="font-medium text-foreground">{tournament.posterName}</span>
                    </p>
                  </div>
                  <Badge className="bg-green-500 text-white mt-3 sm:mt-0">Completed</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

      </div>
      <MadeWithDyad />

      // Registration Dialog
      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Register for {selectedTournament?.name}</DialogTitle>
          </DialogHeader>
          {selectedTournament && (
            <DetailedTournamentRegistrationForm
              // --- FIXED: ADDED MISSING PROPS ---
              tournamentId={selectedTournament.$id} 
              hostUpiId={(selectedTournament as any).upiId || ""} 
              // ---------------------------------
              tournamentName={selectedTournament.name}
              gameName={selectedTournament.game}
              fee={selectedTournament.fee}
              minPlayers={selectedTournament.minPlayers}
              maxPlayers={selectedTournament.maxPlayers}
              onRegister={handleRegistrationSubmit}
              onCancel={() => setIsRegisterDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      // Tournament Management Dialog
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
*/