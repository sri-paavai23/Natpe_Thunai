"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Gamepad2, DollarSign, Loader2, PlusCircle, Trophy } from "lucide-react"; // Fixed: Imported Trophy
import { toast } from "sonner";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TOURNAMENTS_COLLECTION_ID } from "@/lib/appwrite";
import { Query, Models } from "appwrite";
import { useAuth } from "@/context/AuthContext";
import DetailedTournamentRegistrationForm from "@/components/forms/DetailedTournamentRegistrationForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Tournament extends Models.Document {
  name: string;
  game: string;
  date: string; // ISO date string
  time: string; // HH:MM format
  entryFee: number;
  prizePool: number;
  status: "Upcoming" | "Ongoing" | "Completed";
  description: string;
  minPlayers: number;
  maxPlayers: number;
  registeredTeams: number;
  maxTeams: number;
}

const TournamentsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"upcoming" | "ongoing" | "completed">("upcoming");
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isRegistrationDialogOpen, setIsRegistrationDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TOURNAMENTS_COLLECTION_ID,
        [Query.orderAsc('date'), Query.orderAsc('time')]
      );
      setTournaments(response.documents as unknown as Tournament[]);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      toast.error("Failed to load tournaments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TOURNAMENTS_COLLECTION_ID}.documents`,
      (response) => {
        // Re-fetch all data on any tournament change for simplicity
        fetchTournaments();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchTournaments]);

  const handleRegisterClick = (tournament: Tournament) => {
    if (!user) {
      toast.error("You need to be logged in to register for a tournament.");
      return;
    }
    setSelectedTournament(tournament);
    setIsRegistrationDialogOpen(true);
  };

  const handleRegistrationComplete = (data: { teamName: string; contactEmail: string; players: any[] }) => {
    toast.success(`Successfully registered team "${data.teamName}" for ${selectedTournament?.name}!`);
    setIsRegistrationDialogOpen(false);
    setSelectedTournament(null);
    // In a real app, you'd update the tournament's registeredTeams count in Appwrite
    // and potentially add the team to a separate registration collection.
  };

  const renderTournamentCards = (statusFilter: Tournament["status"]) => {
    const filteredTournaments = tournaments.filter(t => t.status === statusFilter);

    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
          <p className="ml-3 text-muted-foreground">Loading tournaments...</p>
        </div>
      );
    }

    if (filteredTournaments.length === 0) {
      return <p className="text-center text-muted-foreground py-4">No {statusFilter.toLowerCase()} tournaments found.</p>;
    }

    return filteredTournaments.map((tournament) => (
      <Card key={tournament.$id} className="bg-card border-border p-4 shadow-md">
        <CardHeader className="p-0 pb-2">
          <CardTitle className="text-xl font-semibold text-foreground">{tournament.name}</CardTitle>
          <Badge className="bg-primary-blue-light text-primary-foreground">{tournament.status}</Badge>
        </CardHeader>
        <CardContent className="p-0 space-y-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-2"><Gamepad2 className="h-4 w-4 text-secondary-neon" /> Game: {tournament.game}</p>
          <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-secondary-neon" /> Date: {new Date(tournament.date).toLocaleDateString()} at {tournament.time}</p>
          <p className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-secondary-neon" /> Entry Fee: ₹{tournament.entryFee.toFixed(2)}</p>
          <p className="flex items-center gap-2"><Trophy className="h-4 w-4 text-secondary-neon" /> Prize Pool: ₹{tournament.prizePool.toFixed(2)}</p>
          <p className="flex items-center gap-2"><Users className="h-4 w-4 text-secondary-neon" /> Teams: {tournament.registeredTeams}/{tournament.maxTeams}</p>
          <p className="text-xs mt-2">{tournament.description}</p>
          {tournament.status === "Upcoming" && (
            <Button
              className="w-full mt-4 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
              onClick={() => handleRegisterClick(tournament)}
              disabled={tournament.registeredTeams >= tournament.maxTeams}
            >
              {tournament.registeredTeams >= tournament.maxTeams ? "Registration Full" : "Register Now"}
            </Button>
          )}
        </CardContent>
      </Card>
    ));
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Esports Tournaments</h1>
      <div className="max-w-2xl mx-auto space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "upcoming" | "ongoing" | "completed")} className="w-full">
          {/* Updated TabsList for mobile responsiveness */}
          <TabsList className="flex w-full overflow-x-auto whitespace-nowrap bg-primary-blue-light text-primary-foreground h-auto p-1">
            <TabsTrigger value="upcoming" className="flex-shrink-0 min-w-[120px] text-xs sm:text-sm data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Upcoming</TabsTrigger>
            <TabsTrigger value="ongoing" className="flex-shrink-0 min-w-[120px] text-xs sm:text-sm data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Ongoing</TabsTrigger>
            <TabsTrigger value="completed" className="flex-shrink-0 min-w-[120px] text-xs sm:text-sm data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Completed</TabsTrigger>
          </TabsList>
          <div className="mt-4 space-y-4">
            <TabsContent value="upcoming" className="space-y-3">
              {renderTournamentCards("Upcoming")}
            </TabsContent>
            <TabsContent value="ongoing" className="space-y-3">
              {renderTournamentCards("Ongoing")}
            </TabsContent>
            <TabsContent value="completed" className="space-y-3">
              {renderTournamentCards("Completed")}
            </TabsContent>
          </div>
        </Tabs>
      </div>
      <MadeWithDyad />

      {/* Tournament Registration Dialog */}
      <Dialog open={isRegistrationDialogOpen} onOpenChange={setIsRegistrationDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Register for {selectedTournament?.name}</DialogTitle>
          </DialogHeader>
          {selectedTournament && (
            <DetailedTournamentRegistrationForm
              tournamentName={selectedTournament.name}
              gameName={selectedTournament.game}
              fee={selectedTournament.entryFee}
              minPlayers={selectedTournament.minPlayers}
              maxPlayers={selectedTournament.maxPlayers}
              onRegister={handleRegistrationComplete}
              onCancel={() => setIsRegistrationDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentsPage;