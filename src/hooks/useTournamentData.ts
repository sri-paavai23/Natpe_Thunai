"use client";

import { useState, useEffect, useCallback } from "react";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TOURNAMENTS_COLLECTION_ID } from "@/lib/appwrite";
import { Models, Query, ID } from "appwrite";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export interface TeamStanding {
  teamName: string;
  points: number;
  rank: number;
}

export interface Winner {
  position: number;
  name: string;
  prize?: string;
}

export interface Tournament extends Models.Document {
  title: string;
  description: string;
  game: string;
  platform: string;
  startDate: string;
  endDate: string;
  registrationLink: string;
  organizerId: string;
  organizerName: string;
  collegeName: string;
  status: "upcoming" | "active" | "completed" | "cancelled";
  prizePool?: string;
  rulesLink?: string;
  maxParticipants?: number;
  participants?: string[]; // Array of user IDs
  // New fields for tournament management
  standings?: TeamStanding[]; // Added
  winners?: Winner[]; // Added
}

export const useTournamentData = () => {
  const { user, userProfile } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTournaments = useCallback(async () => {
    if (!userProfile?.collegeName) {
      setIsLoading(false);
      setError("User college information not available.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TOURNAMENTS_COLLECTION_ID,
        [Query.equal("collegeName", userProfile.collegeName), Query.orderDesc("startDate")]
      );
      setTournaments(response.documents as unknown as Tournament[]);
    } catch (err: any) {
      console.error("Error fetching tournaments:", err);
      setError(err.message || "Failed to fetch tournaments.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName]);

  useEffect(() => {
    fetchTournaments();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TOURNAMENTS_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          setTournaments((prev) => [response.payload as unknown as Tournament, ...prev]);
        } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          setTournaments((prev) =>
            prev.map((t) =>
              t.$id === (response.payload as Tournament).$id
                ? (response.payload as unknown as Tournament)
                : t
            )
          );
        } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
          setTournaments((prev) =>
            prev.filter((t) => t.$id !== (response.payload as Tournament).$id)
          );
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchTournaments]);

  const createTournament = async (tournamentData: Omit<Tournament, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "organizerId" | "organizerName" | "collegeName" | "status" | "participants" | "standings" | "winners">) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to create a tournament.");
      return;
    }
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TOURNAMENTS_COLLECTION_ID,
        ID.unique(),
        {
          ...tournamentData,
          organizerId: user.$id,
          organizerName: user.name,
          collegeName: userProfile.collegeName,
          status: "upcoming",
          participants: [],
          standings: [],
          winners: [],
        }
      );
      toast.success("Tournament created successfully!");
    } catch (err: any) {
      console.error("Error creating tournament:", err);
      toast.error(err.message || "Failed to create tournament.");
    }
  };

  const updateTournament = async (tournamentId: string, tournamentData: Partial<Tournament>) => {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TOURNAMENTS_COLLECTION_ID,
        tournamentId,
        tournamentData
      );
      toast.success("Tournament updated successfully!");
    } catch (err: any) {
      console.error("Error updating tournament:", err);
      toast.error(err.message || "Failed to update tournament.");
    }
  };

  const deleteTournament = async (tournamentId: string) => {
    try {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TOURNAMENTS_COLLECTION_ID,
        tournamentId
      );
      toast.success("Tournament deleted successfully!");
    } catch (err: any) {
      console.error("Error deleting tournament:", err);
      toast.error(err.message || "Failed to delete tournament.");
    }
  };

  const registerForTournament = async (tournamentId: string) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to register.");
      return;
    }
    try {
      const tournament = tournaments.find(t => t.$id === tournamentId);
      if (!tournament) {
        toast.error("Tournament not found.");
        return;
      }
      if (tournament.participants?.includes(user.$id)) {
        toast.info("You are already registered for this tournament.");
        return;
      }
      const updatedParticipants = [...(tournament.participants || []), user.$id];
      await updateTournament(tournamentId, { participants: updatedParticipants });
      toast.success("Successfully registered for the tournament!");
    } catch (err: any) {
      console.error("Error registering for tournament:", err);
      toast.error(err.message || "Failed to register for tournament.");
    }
  };

  return {
    tournaments,
    isLoading,
    error,
    refetchTournaments: fetchTournaments,
    createTournament,
    updateTournament,
    deleteTournament,
    registerForTournament,
  };
};