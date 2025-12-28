import { useState, useEffect, useCallback } from 'react';
import { Client, Databases, Query, Models, ID } from 'appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

// Collection IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const TOURNAMENTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_TOURNAMENTS_COLLECTION_ID;

// Define Tournament related interfaces
export type TournamentStatus = "Open" | "Ongoing" | "Completed" | "Closed";

export interface TeamStanding {
  teamName: string;
  score: number;
  rank: number;
}

export interface Winner {
  tournamentId: string; // Reference to the tournament
  winnerTeamName: string;
  prize: string; // e.g., "₹5000", "Trophy"
}

export interface Tournament extends Models.Document {
  title: string;
  game: string;
  platform: string;
  date: string; // ISO date string
  time: string; // e.g., "18:00"
  prizePool: string; // e.g., "₹10,000"
  fee: number; // Entry fee
  minPlayers: number; // Min players per team
  maxPlayers: number; // Max players per team
  maxParticipants: number; // Max number of teams/individuals
  currentParticipants: number; // Current number of registered participants
  status: TournamentStatus; // "Open", "Ongoing", "Completed", "Closed"
  posterId: string;
  posterName: string;
  collegeName: string;
  participants: string[]; // Array of user IDs
  description?: string; // Optional description
  standings?: TeamStanding[]; // Optional standings
  winners?: Winner[]; // Optional winners
}

interface TournamentDataState {
  tournaments: Tournament[];
  isLoading: boolean;
  error: string | null;
  fetchTournaments: () => Promise<void>;
  joinTournament: (tournamentId: string, teamName: string, players: string[]) => Promise<void>;
  leaveTournament: (tournamentId: string) => Promise<void>;
  postTournament: (tournamentData: Omit<Tournament, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "posterId" | "posterName" | "collegeName" | "currentParticipants" | "participants" | "status" | "standings" | "winners">) => Promise<void>;
  updateTournament: (tournamentId: string, data: Partial<Tournament>) => Promise<void>;
}

export const useTournamentData = (): TournamentDataState => {
  const { user, userProfile, isLoading: isAuthLoading } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTournaments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        TOURNAMENTS_COLLECTION_ID,
        [
          Query.orderDesc('$createdAt'),
          userProfile?.collegeName ? Query.equal('collegeName', userProfile.collegeName) : Query.limit(100) // Filter by college if available
        ]
      );
      setTournaments(response.documents as Tournament[]);
    } catch (err: any) {
      console.error("Error fetching tournaments:", err);
      setError("Failed to fetch tournaments.");
      toast.error("Failed to load tournaments.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchTournaments();
    }
  }, [fetchTournaments, isAuthLoading]);

  const joinTournament = async (tournamentId: string, teamName: string, players: string[]) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to join a tournament.");
      return;
    }

    const tournament = tournaments.find(t => t.$id === tournamentId);
    if (!tournament) {
      toast.error("Tournament not found.");
      return;
    }

    if (tournament.participants.includes(user.$id)) {
      toast.message("You have already joined this tournament."); // Changed from toast.info
      return;
    }

    if (tournament.currentParticipants >= tournament.maxParticipants) {
      toast.error("This tournament is full.");
      return;
    }

    if (players.length < tournament.minPlayers || players.length > tournament.maxPlayers) {
      toast.error(`Team must have between ${tournament.minPlayers} and ${tournament.maxPlayers} players.`);
      return;
    }

    try {
      const updatedParticipants = [...tournament.participants, user.$id];
      const updatedCurrentParticipants = tournament.currentParticipants + 1;

      await databases.updateDocument(
        DATABASE_ID,
        TOURNAMENTS_COLLECTION_ID,
        tournamentId,
        {
          participants: updatedParticipants,
          currentParticipants: updatedCurrentParticipants,
          // Optionally, store teamName and players somewhere if needed for display
        }
      );
      setTournaments(prev => prev.map(t => t.$id === tournamentId ? { ...t, participants: updatedParticipants, currentParticipants: updatedCurrentParticipants } : t));
      toast.success(`Successfully joined ${tournament.title}!`);
    } catch (err: any) {
      console.error("Error joining tournament:", err);
      toast.error(err.message || "Failed to join tournament.");
    }
  };

  const leaveTournament = async (tournamentId: string) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to leave a tournament.");
      return;
    }

    const tournament = tournaments.find(t => t.$id === tournamentId);
    if (!tournament) {
      toast.error("Tournament not found.");
      return;
    }

    if (!tournament.participants.includes(user.$id)) {
      toast.message("You are not a participant in this tournament."); // Changed from toast.info
      return;
    }

    try {
      const updatedParticipants = tournament.participants.filter(id => id !== user.$id);
      const updatedCurrentParticipants = tournament.currentParticipants - 1;

      await databases.updateDocument(
        DATABASE_ID,
        TOURNAMENTS_COLLECTION_ID,
        tournamentId,
        {
          participants: updatedParticipants,
          currentParticipants: updatedCurrentParticipants,
        }
      );
      setTournaments(prev => prev.map(t => t.$id === tournamentId ? { ...t, participants: updatedParticipants, currentParticipants: updatedCurrentParticipants } : t));
      toast.success(`Successfully left ${tournament.title}.`);
    } catch (err: any) {
      console.error("Error leaving tournament:", err);
      toast.error(err.message || "Failed to leave tournament.");
    }
  };

  const postTournament = async (tournamentData: Omit<Tournament, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "posterId" | "posterName" | "collegeName" | "currentParticipants" | "participants" | "status" | "standings" | "winners">) => {
    if (!user || !userProfile || !userProfile.collegeName) {
      toast.error("You must be logged in and have a college name set to post a tournament.");
      return;
    }

    try {
      const newTournament = await databases.createDocument(
        DATABASE_ID,
        TOURNAMENTS_COLLECTION_ID,
        ID.unique(), // Changed from Models.ID.unique()
        {
          ...tournamentData,
          posterId: user.$id,
          posterName: user.name,
          collegeName: userProfile.collegeName,
          currentParticipants: 0,
          participants: [],
          status: "Open", // Default status
          standings: [],
          winners: [],
        }
      );
      setTournaments(prev => [newTournament as Tournament, ...prev]);
      toast.success("Tournament posted successfully!");
    } catch (err: any) {
      console.error("Error posting tournament:", err);
      toast.error(err.message || "Failed to post tournament.");
      throw err;
    }
  };

  const updateTournament = async (tournamentId: string, data: Partial<Tournament>) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to update a tournament.");
      return;
    }

    try {
      const updatedDoc = await databases.updateDocument(
        DATABASE_ID,
        TOURNAMENTS_COLLECTION_ID,
        tournamentId,
        data
      );
      setTournaments(prev => prev.map(t => t.$id === tournamentId ? { ...t, ...data } : t));
      toast.success("Tournament updated successfully!");
    } catch (err: any) {
      console.error("Error updating tournament:", err);
      toast.error(err.message || "Failed to update tournament.");
      throw err;
    }
  };

  return {
    tournaments,
    isLoading,
    error,
    fetchTournaments,
    joinTournament,
    leaveTournament,
    postTournament,
    updateTournament,
  };
};