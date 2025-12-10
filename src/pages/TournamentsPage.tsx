"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Gamepad2, CalendarDays, DollarSign, Trophy, Users, Info, Scale } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostTournamentForm, { TournamentPostData } from "@/components/forms/PostTournamentForm";
import { useTournamentData, Tournament } from "@/hooks/useTournamentData";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TOURNAMENTS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const TournamentsPage = () => {
  const { user, userProfile } = useAuth();
  const [isPostTournamentDialogOpen, setIsPostTournamentDialogOpen] = useState(false);
  
  const { tournaments, isLoading, error } = useTournamentData();

  const handlePostTournament = async (data: TournamentPostData) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a tournament.");
      return;
    }

    try {
      const newTournamentData = {
        ...data,
        date: format(data.date, "yyyy-MM-dd"), // Format date to string for Appwrite
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName,
        registeredTeams: JSON.stringify([]), // Initialize as empty JSON array string
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TOURNAMENTS_COLLECTION_ID,
        ID.unique(),
        newTournamentData
      );
      
      toast.success(`Your tournament "${data.name}" has been posted!`);
      setIsPostTournamentDialogOpen(false);
    } catch (e: any) {
      console.error("Error posting tournament:", e);
      toast.error(e.message || "Failed to post tournament listing.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Esports Arena</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-secondary-neon" /> Host a Tournament
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Organize and manage esports tournaments for your college community!
            </p>
            <Dialog open={isPostTournamentDialogOpen} onOpenChange={setIsPostTournamentDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post New Tournament
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Esports Tournament</DialogTitle>
                </DialogHeader>
                <PostTournamentForm 
                  onSubmit={handlePostTournament} // Corrected prop name
                  onCancel={() => setIsPostTournamentDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

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
            ) : tournaments.length > 0 ? (
              tournaments.map((tournament) => (
                <div key={tournament.$id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground text-lg">{tournament.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Gamepad2 className="h-4 w-4 text-primary-blue-light" /> Game: <span className="font-medium text-foreground">{tournament.game}</span>
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-4 w-4 text-primary-blue-light" /> Date: <span className="font-medium text-foreground">{format(new Date(tournament.date), "PPP")}</span>
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-primary-blue-light" /> Fee: <span className="font-medium text-foreground">₹{tournament.fee}</span>
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-primary-blue-light" /> Prize Pool: <span className="font-medium text-foreground">{tournament.prizePool}</span>
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="h-4 w-4 text-primary-blue-light" /> Players/Team: <span className="font-medium text-foreground">{tournament.minPlayers}-{tournament.maxPlayers}</span>
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Info className="h-4 w-4 text-primary-blue-light" /> Status: <Badge variant="secondary" className="bg-primary-blue-light text-primary-foreground">{tournament.status}</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Posted by: <span className="font-medium text-foreground">{tournament.posterName}</span> from <span className="font-medium text-foreground">{tournament.collegeName}</span></p>
                  <p className="text-xs text-muted-foreground">Registered Teams: <span className="font-medium text-foreground">{tournament.registeredTeams.length > 0 ? tournament.registeredTeams.join(', ') : 'None'}</span></p>
                  <Button variant="outline" size="sm" className="mt-3 w-full border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10">
                    View Details / Register
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No tournaments posted yet for your college. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default TournamentsPage;