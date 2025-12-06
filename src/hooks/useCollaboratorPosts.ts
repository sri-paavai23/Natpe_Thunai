import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_COLLABORATORS_COLLECTION_ID } from '@/lib/appwrite'; // Fixed: Corrected import
import { Models, Query } from 'appwrite';
import { toast } from 'sonner';

export interface CollaboratorPost extends Models.Document {
  title: string;
  description: string;
  skillsRequired: string[];
  contactEmail: string;
  status: "Open" | "Filled" | "Completed";
  posterId: string;
  posterName: string;
  projectType: string; // e.g., "Academic", "Startup", "Event"
  deadline?: string; // Optional deadline
}

export const useCollaboratorPosts = () => {
  const [collaboratorPosts, setCollaboratorPosts] = useState<CollaboratorPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCollaboratorPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLABORATORS_COLLECTION_ID,
        [Query.orderDesc('$createdAt')]
      );
      setCollaboratorPosts(response.documents as unknown as CollaboratorPost[]);
    } catch (err: any) {
      console.error("Error fetching collaborator posts:", err);
      setError(err.message || "Failed to load collaborator posts.");
      toast.error(err.message || "Failed to load collaborator posts.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollaboratorPosts();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_COLLABORATORS_COLLECTION_ID}.documents`,
      (response) => {
        // For simplicity, re-fetch all items on any change
        fetchCollaboratorPosts();
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchCollaboratorPosts]);

  return { collaboratorPosts, isLoading, error, refreshCollaboratorPosts: fetchCollaboratorPosts };
};