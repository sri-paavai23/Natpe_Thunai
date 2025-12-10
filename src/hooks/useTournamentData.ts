"use client";

import { databases, APPWRITE_DATABASE_ID, APPWRITE_TOURNAMENTS_COLLECTION_ID } from "@/lib/appwrite";
import { Query, Models } from "appwrite";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export interface TeamStanding {
  rank: number;
  teamName: string;
  status: "1st" | "2nd" | "Eliminated" | "Participating";
  points: number;
}

export interface Winner {
  tournament: string;
  winner: string;
  prize: string;
}

export interface Tournament extends Models.Document {
  name: string;
  game: string;
  date: string; // e.g., "2024-12-25"
  fee: number;
  prizePool: string;
  minPlayers: number;
  maxPlayers: number;
  description: string;
  rules: string;
  posterId: string;
  posterName: string;
  collegeName: string;
  status: "Open" | "Ongoing" | "Completed" | "Closed";
  registeredTeams: string[]; // This will be stored as JSON string in Appwrite
  standings?: TeamStanding[];
  winners?: Winner[];
}

export const useTournamentData = (collegeName?: string) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userProfile } = useAuth();

  const targetCollegeName = collegeName || userProfile?.collegeName;

  const fetchTournaments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let queries = [Query.orderDesc("$createdAt")];

      if (targetCollegeName) {
        queries.push(Query.equal("collegeName", targetCollegeName));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TOURNAMENTS_COLLECTION_ID,
        queries
      );

      const parsedTournaments: Tournament[] = response.documents.map(doc => {
        // Parse registeredTeams from JSON string back to array
        const registeredTeams = typeof doc.registeredTeams === 'string'
          ? JSON.parse(doc.registeredTeams)
          : doc.registeredTeams;

        return {
          ...doc,
          registeredTeams,
        } as Tournament;
      });

      setTournaments(parsedTournaments);
    } catch (err: any) {
      console.error("Error fetching tournaments:", err);
      setError(err.message || "Failed to fetch tournaments.");
    } finally {
      setIsLoading(false);
    }
  };

  const updateTournament = async (tournamentId: string, data: Partial<Tournament>) => {
    try {
      const updatedDoc = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TOURNAMENTS_COLLECTION_ID,
        tournamentId,
        data
      );
      // Optimistically update state or refetch
      setTournaments((prev) =>
        prev.map((t) => (t.$id === updatedDoc.$id ? { ...updatedDoc, registeredTeams: JSON.parse(updatedDoc.registeredTeams as string) } as Tournament : t))
      );
      return updatedDoc;
    } catch (err: any) {
      console.error("Error updating tournament:", err);
      throw new Error(err.message || "Failed to update tournament.");
    }
  };

  useEffect(() => {
    fetchTournaments();

    // Real-time subscription
    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TOURNAMENTS_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          const newTournament = response.payload as Tournament;
          // Parse registeredTeams for new document
          const registeredTeams = typeof newTournament.registeredTeams === 'string'
            ? JSON.parse(newTournament.registeredTeams)
            : newTournament.registeredTeams;
          setTournaments((prev) => [{ ...newTournament, registeredTeams }, ...prev]);
        } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          const updatedTournament = response.payload as Tournament;
          // Parse registeredTeams for updated document
          const registeredTeams = typeof updatedTournament.registeredTeams === 'string'
            ? JSON.parse(updatedTournament.registeredTeams)
            : updatedTournament.registeredTeams;
          setTournaments((prev) =>
            prev.map((t) => (t.$id === updatedTournament.$id ? { ...updatedTournament, registeredTeams } : t))
          );
        } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
          const deletedTournament = response.payload as Tournament;
          setTournaments((prev) => prev.filter((t) => t.$id !== deletedTournament.$id));
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [targetCollegeName]);

  return { tournaments, isLoading, error, updateTournament };
};