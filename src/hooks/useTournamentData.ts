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

// Helper functions for serialization/deserialization
const serializeTeamStandings = (standings: TeamStanding[]): string[] => {
  return standings.map(s => JSON.stringify(s));
};

const deserializeTeamStandings = (standings: string[] | undefined): TeamStanding[] => {
  if (!standings || !Array.isArray(standings)) return [];
  return standings.map(s => {
    try {
      return JSON.parse(s);
    } catch (e) {
      console.error("Failed to parse team standing item:", s, e);
      return { rank: 0, teamName: "Unknown", status: "Participating", points: 0 };
    }
  });
};

const serializeWinners = (winners: Winner[]): string[] => {
  return winners.map(w => JSON.stringify(w));
};

const deserializeWinners = (winners: string[] | undefined): Winner[] => {
  if (!winners || !Array.isArray(winners)) return [];
  return winners.map(w => {
    try {
      return JSON.parse(w);
    } catch (e) {
      console.error("Failed to parse winner item:", w, e);
      return { tournament: "Unknown", winner: "Unknown", prize: "Unknown" };
    }
  });
};


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
      // Deserialize standings and winners when fetching
      const deserializedTournaments = (response.documents as any[]).map(doc => ({
          ...doc,
          standings: deserializeTeamStandings(doc.standings),
          winners: deserializeWinners(doc.winners),
      })) as Tournament[];

      setTournaments(deserializedTournaments);
    } catch (err: any) {
      console.error("Error fetching tournaments:", err);
      setError(err.message || "Failed to fetch tournaments.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName]);

  const updateTournament = useCallback(async (tournamentId: string, data: Partial<Tournament>) => {
    try {
      // Serialize standings and winners before sending to Appwrite
      const dataToUpdate: Partial<Omit<Tournament, 'standings' | 'winners'>> & { standings?: string[]; winners?: string[] } = {
        ...data,
        standings: data.standings ? serializeTeamStandings(data.standings) : undefined,
        winners: data.winners ? serializeWinners(data.winners) : undefined,
      };

      const updatedDoc = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TOURNAMENTS_COLLECTION_ID,
        tournamentId,
        dataToUpdate
      );
      // Deserialize the updated document for local state consistency
      const deserializedUpdatedDoc: Tournament = {
          ...(updatedDoc as any),
          standings: deserializeTeamStandings((updatedDoc as any).standings),
          winners: deserializeWinners((updatedDoc as any).winners),
      };
      setTournaments(prev => prev.map(t => t.$id === tournamentId ? deserializedUpdatedDoc : t));
      return deserializedUpdatedDoc;
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
        const payload = response.payload as any;

        if (payload.collegeName !== userProfile.collegeName) {
          return;
        }
        
        // Deserialize payload from real-time update
        const deserializedPayload: Tournament = {
            ...payload,
            standings: deserializeTeamStandings(payload.standings),
            winners: deserializeWinners(payload.winners),
        };

        setTournaments(prev => {
          const existingIndex = prev.findIndex(t => t.$id === deserializedPayload.$id);
          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1) {
              return [deserializedPayload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              return prev.map(t => t.$id === deserializedPayload.$id ? deserializedPayload : t);
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            if (existingIndex !== -1) {
              return prev.filter(t => t.$id !== deserializedPayload.$id);
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