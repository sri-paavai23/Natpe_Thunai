"use client";

import { useState, useEffect, useCallback } from "react";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TOURNAMENTS_COLLECTION_ID } from "@/lib/appwrite";
import { Models, Query } from "appwrite";
import { useAuth } from "@/context/AuthContext";

export interface TeamStanding {
  rank: number;
  teamName: string;
  status: "1st" | "2nd" | "Eliminated" | "Participating";
  points: number;
}

export interface Winner {
  tournament: string;
  winner: string; // Team name or player name
  prize: string;
}

export interface Tournament extends Models.Document {
  name: string;
  game: string;
  date: string;
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
  registeredTeams: string[]; // Array of team names or IDs
  standings?: TeamStanding[];
  winners?: Winner[];
}

export const useTournamentData = () => {
  const { userProfile } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTournaments = useCallback(async () => {
    if (!userProfile?.collegeName) {
      setIsLoading(false);
      setTournaments([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TOURNAMENTS_COLLECTION_ID,
        [
          Query.orderDesc('$createdAt'),
          Query.equal('collegeName', userProfile.collegeName)
        ]
      );
      setTournaments(response.documents as unknown as Tournament[]);
    } catch (err: any) {
      console.error("Error fetching tournaments:", err);
      setError(err.message || "Failed to fetch tournaments.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName]);

  const updateTournament = useCallback(async (tournamentId: string, data: Partial<Tournament>) => {
    try {
      const updatedDoc = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TOURNAMENTS_COLLECTION_ID,
        tournamentId,
        data
      );
      setTournaments(prev => prev.map(t => t.$id === tournamentId ? (updatedDoc as unknown as Tournament) : t));
      return updatedDoc as unknown as Tournament;
    } catch (err: any) {
      console.error("Error updating tournament:", err);
      throw new Error(err.message || "Failed to update tournament.");
    }
  }, []);

  useEffect(() => {
    fetchTournaments();

    if (!userProfile?.collegeName) return;

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_TOURNAMENTS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as Tournament;

        if (payload.collegeName !== userProfile.collegeName) {
          return;
        }

        setTournaments(prev => {
          const existingIndex = prev.findIndex(t => t.$id === payload.$id);
          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1) {
              return [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              return prev.map(t => t.$id === payload.$id ? payload : t);
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            if (existingIndex !== -1) {
              return prev.filter(t => t.$id !== payload.$id);
            }
          }
          return prev;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchTournaments, userProfile?.collegeName]);

  return { tournaments, isLoading, error, fetchTournaments, updateTournament };
};