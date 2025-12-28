import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Calendar, Users, Gamepad2, Info, Trophy } from "lucide-react";
import DetailedTournamentRegistrationForm from "@/components/forms/DetailedTournamentRegistrationForm";
import TournamentManagementForm from "@/components/forms/TournamentManagementForm";
import PostTournamentForm from "@/components/forms/PostTournamentForm";
import { useTournamentData, Tournament, TeamStanding, Winner } from "@/hooks/useTournamentData";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const TournamentPage = () => {
  const { tournaments, isLoading, error, joinTournament, leaveTournament } = useTournamentData();
  const { user, userProfile } = useAuth();
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isPostTournamentDialogOpen, setIsPostTournamentDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  // Aggregate data from all tournaments
  const upcomingTournaments = tournaments.filter(t => t.status === "Open");
  const ongoingTournaments = tournaments.filter(t => t.status === "Ongoing");
  const completedTournaments = tournaments.filter(t => t.status === "Completed");

  // Aggregate all winners from all tournaments
  const allWinners: Winner[] = tournaments.flatMap(t => t.winners || []);

  // For simplicity, we'll display standings from the first tournament that has them, or an empty array.
  const activeStandings: TeamStanding[] = tournaments.find(t => t.standings && t.standings.length > 0)?.standings || [];

  const handleRegistrationSubmit = async (data: { teamName: string; players: string[] }) => {
    if (!selectedTournament) return;

    try {
      await joinTournament(selectedTournament.$id, data.teamName, data.players);
      // If onRegister is called, we assume payment initiation was successful (or fee was zero).
      toast.success(`Successfully registered "${data.teamName}" (${data.players.length} players) for ${selectedTournament.title}!`); // Changed from name to title
      setIsRegisterDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to register for tournament.");
    }
  };

  const handleLeaveTournament = async (tournamentId: string) => {
    try {
      await leaveTournament(tournamentId);
      toast.success("Successfully left the tournament.");
    } catch (err: any) {
      toast.error(err.message || "Failed to leave tournament.");
    }
  };

  const handlePostTournamentSuccess = () => {
    setIsPostTournamentDialogOpen(false);
    toast.success("Tournament posted successfully!");
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading tournaments...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-foreground">College Tournaments</h1>

      <div className="flex justify-end mb-4">
        {userProfile?.isDeveloper && (
          <Dialog open={isPostTournamentDialogOpen} onOpenChange={setIsPostTournamentDialogOpen}>
            <DialogTrigger asChild>
              <Button>Post New Tournament</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Post a New Tournament</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new tournament for your college.
                </DialogDescription>
              </DialogHeader>
              <PostTournamentForm onSuccess={handlePostTournamentSuccess} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming ({upcomingTournaments.length})</TabsTrigger>
          <TabsTrigger value="ongoing">Ongoing ({ongoingTournaments.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTournaments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Upcoming Tournaments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingTournaments.length > 0 ? (
              upcomingTournaments.map(tournament => (
                <Card key={tournament.$id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gamepad2 className="h-5 w-5" />
                      <div>
                        <h3 className="font-semibold text-foreground">{tournament.title}</h3> {/* Changed from name to title */}
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {new Date(tournament.date).toLocaleDateString()} at {tournament.time}
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Fee: {tournament.fee === 0 ? "Free" : `₹${tournament.fee}`} | Prize: {tournament.prizePool} {/* Used fee and prizePool */}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Users className="h-3 w-3" /> Players per team: {tournament.minPlayers}-{tournament.maxPlayers} {/* Used minPlayers and maxPlayers */}
                    </p>
                    {tournament.description && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Info className="h-3 w-3" /> {tournament.description} {/* Used description */}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {tournament.currentParticipants}/{tournament.maxParticipants} participants
                    </p>
                  </CardContent>
                  <div className="p-4 pt-0 flex gap-2">
                    {user && tournament.participants.includes(user.$id) ? (
                      <Button variant="outline" onClick={() => handleLeaveTournament(tournament.$id)} className="w-full">
                        Leave Tournament
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setSelectedTournament(tournament);
                          setIsRegisterDialogOpen(true);
                        }}
                        className="w-full"
                        disabled={tournament.currentParticipants >= tournament.maxParticipants}
                      >
                        Register
                      </Button>
                    )}
                    {userProfile?.isDeveloper && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSelectedTournament(tournament);
                          setIsManageDialogOpen(true);
                        }}
                      >
                        Manage
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground">No upcoming tournaments.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ongoing" className="mt-4">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Ongoing Tournaments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ongoingTournaments.length > 0 ? (
              ongoingTournaments.map(tournament => (
                <Card key={tournament.$id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gamepad2 className="h-5 w-5" />
                      <div>
                        <h3 className="font-semibold text-foreground">{tournament.title}</h3> {/* Changed from name to title */}
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {new Date(tournament.date).toLocaleDateString()} at {tournament.time}
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Prize: {tournament.prizePool}
                    </p>
                    {tournament.description && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Info className="h-3 w-3" /> {tournament.description}
                      </p>
                    )}
                    {activeStandings.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-sm mb-2">Live Standings:</h4>
                        <ul className="text-xs text-muted-foreground">
                          {activeStandings.map((standing, index) => (
                            <li key={index}>{standing.rank}. {standing.teamName} - {standing.score} pts</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                  <div className="p-4 pt-0 flex gap-2">
                    {userProfile?.isDeveloper && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSelectedTournament(tournament);
                          setIsManageDialogOpen(true);
                        }}
                        className="w-full"
                      >
                        Manage
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground">No ongoing tournaments.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Completed Tournaments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedTournaments.length > 0 ? (
              completedTournaments.map(tournament => (
                <Card key={tournament.$id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gamepad2 className="h-5 w-5" />
                      <div>
                        <h3 className="font-semibold text-foreground">{tournament.title}</h3> {/* Changed from name to title */}
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {new Date(tournament.date).toLocaleDateString()}
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-3 w-3" /> Prize: {tournament.prizePool}
                    </p>
                    {tournament.winners && tournament.winners.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-1"><Trophy className="h-4 w-4" /> Winners:</h4>
                        <ul className="text-sm text-muted-foreground">
                          {tournament.winners.map((winner, index) => (
                            <li key={index}>{winner.winnerTeamName} ({winner.prize})</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                  <div className="p-4 pt-0 flex gap-2">
                    {userProfile?.isDeveloper && (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setSelectedTournament(tournament);
                          setIsManageDialogOpen(true);
                        }}
                        className="w-full"
                      >
                        Manage
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground">No completed tournaments.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {selectedTournament && (
        <>
          <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-foreground">Register for {selectedTournament?.title}</DialogTitle> {/* Changed from name to title */}
                <DialogDescription>
                  Enter your team details to register for the tournament.
                </DialogDescription>
              </DialogHeader>
              <DetailedTournamentRegistrationForm
                tournamentName={selectedTournament.title} // Changed from name to title
                gameName={selectedTournament.game}
                fee={selectedTournament.fee}
                minPlayers={selectedTournament.minPlayers}
                maxPlayers={selectedTournament.maxPlayers}
                onRegister={handleRegistrationSubmit}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="text-foreground">Manage Tournament: {selectedTournament?.title}</DialogTitle> {/* Changed from name to title */}
                <DialogDescription>
                  Update tournament status, standings, and winners.
                </DialogDescription>
              </DialogHeader>
              <TournamentManagementForm tournament={selectedTournament} onClose={() => setIsManageDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default TournamentPage;