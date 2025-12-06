"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_COLLABORATORS_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';
import { toast } from 'sonner';

export interface CollaboratorPost extends Models.Document {
  title: string;
  description: string;
  skillsNeeded: string;
  contact: string;
  posterId: string;
  posterName: string;
}

interface CollaboratorPostsState {
  posts: CollaboratorPost[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useCollaboratorPosts = (): CollaboratorPostsState => {
  const [posts, setPosts] = useState<CollaboratorPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLABORATORS_COLLECTION_ID,
        [Query.orderDesc('$createdAt')]
      );
      setPosts(response.documents as unknown as CollaboratorPost[]);
    } catch (err: any) {
      console.error("Error fetching collaborator posts:", err);
      setError(err.message || "Failed to load collaborator posts.");
      toast.error("Failed to load collaborator posts.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_COLLABORATORS_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as CollaboratorPost;

        setPosts(prev => {
          const existingIndex = prev.findIndex(p => p.$id === payload.$id);

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1) {
              toast.info(`New collaboration post: ${payload.title}`);
              return [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              toast.info(`Collaboration post updated: ${payload.title}`);
              return prev.map(p => p.$id === payload.$id ? payload : p);
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            if (existingIndex !== -1) {
              toast.info(`Collaboration post removed: ${payload.title}`);
              return prev.filter(p => p.$id !== payload.$id);
            }
          }
          return prev;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchPosts]);

  return { posts, isLoading, error, refetch: fetchPosts };
};