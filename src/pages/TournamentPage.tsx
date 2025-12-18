"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Trophy, Calendar, Gamepad, Users, ExternalLink, Award, ListOrdered, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import PostTournamentForm from "@/components/forms/PostTournamentForm";
import { useTournamentData, Tournament, TeamStanding, Winner } from "@/hooks/useTournamentData";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import TournamentManagementForm from "@/components/forms/TournamentManagementForm";

const TournamentPage = () => {
  const { user, userProfile } = useAuth();
  const [isPostTournamentDialogOpen, setIsPostTournamentDialogOpen] = useState(false);
  const [isManageTournamentDialogOpen, setIsManageTournamentDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  const { tournaments, isLoading, error, createTournament, updateTournament, deleteTournament, registerForTournament } = useTournamentData();

  const isAgeGated = (userProfile?.age ?? 0) >= 25;

  const getStatusBadgeClass = (status: Tournament["status"]) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500 text-white";
      case "active":
        return "bg-green-500 text-white";
      case "completed":
        return "bg-gray-500 text-white";
      case "cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handlePostTournament = async (data: Omit<Tournament, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "organizerId" | "organizerName" | "collegeName" | "status" | "participants" | "standings" | "winners">) => {
    await createTournament(data);
    setIsPostTournamentDialogOpen(false);
  };

  const handleManageClick = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setIsManageTournamentDialogOpen(true);
  };

  const handleUpdateTournament = async (data: Partial<Tournament>) => {
    if (selectedTournament) {
      await updateTournament(selectedTournament.$id, data);
      setIsManageTournamentDialogOpen(false);
      setSelectedTournament(null);
    }
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    if (window.confirm("Are you sure you want to delete this tournament? This action cannot be undone.")) {
      await deleteTournament(tournamentId);
      setIsManageTournamentDialogOpen(false);
      setSelectedTournament(null);
    }
  };

  const handleRegisterClick = async (tournamentId: string) => {
    await registerForTournament(tournamentId);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Tournament Hub</h1>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Post New Tournament Card */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-secondary-neon" /> Organize a Tournament
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Create and manage esports or other competitive events for your college.
            </p>
            <Dialog open={isPostTournamentDialogOpen} onOpenChange={setIsPostTournamentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4" disabled={isAgeGated}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Post New Tournament
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Create New Tournament</DialogTitle>
                </DialogHeader>
                <PostTournamentForm
                  onSubmit={handlePostTournament}
                  onCancel={() => setIsPostTournamentDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
            <p className="text-xs text-destructive-foreground mt-4">
              Note: This section is age-gated for users under 25.
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Tournaments */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Upcoming Tournaments</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading tournaments...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading tournaments: {error}</p>
            ) : tournaments.filter(t => t.status === "upcoming" || t.status === "active").length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tournaments.filter(t => t.status === "upcoming" || t.status === "active").map((tournament) => (
                  <Card key={tournament.$id} className="bg-background border-border p-4">
                    <h3 className="font-semibold text-foreground text-lg">{tournament.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Gamepad className="h-4 w-4" /> {tournament.game} on {tournament.platform}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                    </p>
                    {tournament.prizePool && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Award className="h-4 w-4" /> Prize Pool: {tournament.prizePool}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">Organizer: {tournament.organizerName}</p>
                    <p className="text-xs text-muted-foreground">Participants: {tournament.participants?.length || 0}{tournament.maxParticipants ? `/${tournament.maxParticipants}` : ''}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className={cn("px-2 py-1 text-xs font-semibold", getStatusBadgeClass(tournament.status))}>
                        {tournament.status}
                      </Badge>
                      <a href={tournament.registrationLink} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="h-7 text-xs border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10">
                          <ExternalLink className="h-3 w-3 mr-1" /> Register
                        </Button>
                      </a>
                      {user?.$id === tournament.organizerId && (
                        <Button variant="secondary" size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white" onClick={() => handleManageClick(tournament)}>
                          Manage
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No upcoming or active tournaments found for your college.</p>
            )}
          </CardContent>
        </Card>

        {/* Completed Tournaments */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Completed Tournaments</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading tournaments...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading tournaments: {error}</p>
            ) : tournaments.filter(t => t.status === "completed").length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tournaments.filter(t => t.status === "completed").map((tournament) => (
                  <Card key={tournament.$id} className="bg-background border-border p-4">
                    <h3 className="font-semibold text-foreground text-lg">{tournament.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Gamepad className="h-4 w-4" /> {tournament.game} on {tournament.platform}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" /> {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Organizer: {tournament.organizerName}</p>
                    {tournament.winners && tournament.winners.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1">
                          <Trophy className="h-4 w-4 text-yellow-500" /> Winners:
                        </h4>
                        <ul className="list-disc list-inside text-xs text-muted-foreground">
                          {tournament.winners.map((winner, idx) => (
                            <li key={idx}>{winner.position}. {winner.name} {winner.prize ? `(${winner.prize})` : ''}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {tournament.standings && tournament.standings.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-sm font-semibold text-foreground flex items-center gap-1">
                          <ListOrdered className="h-4 w-4 text-blue-500" /> Standings:
                        </h4>
                        <ul className="list-disc list-inside text-xs text-muted-foreground">
                          {tournament.standings.map((standing, idx) => (
                            <li key={idx}>Rank {standing.rank}: {standing.teamName} ({standing.points} pts)</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {user?.$id === tournament.organizerId && (
                        <Button variant="secondary" size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white mt-2" onClick={() => handleManageClick(tournament)}>
                          Manage
                        </Button>
                      )}
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No completed tournaments found for your college.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />

      {/* Tournament Management Dialog */}
      <Dialog open={isManageTournamentDialogOpen} onOpenChange={setIsManageTournamentDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Manage Tournament: {selectedTournament?.title}</DialogTitle>
          </DialogHeader>
          {selectedTournament && (
            <TournamentManagementForm
              tournament={selectedTournament}
              onSubmit={handleUpdateTournament}
              onCancel={() => setIsManageTournamentDialogOpen(false)}
            />
          )}
          <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={() => selectedTournament && handleDeleteTournament(selectedTournament.$id)}
              className="w-full sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Tournament
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentPage;