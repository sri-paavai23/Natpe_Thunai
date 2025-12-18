"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_COLLABORATORS_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query, ID } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export interface CollaboratorPost extends Models.Document {
  posterId: string;
  posterName: string;
  collegeName: string;
  title: string;
  description: string;
  skillsNeeded: string[];
  contact: string;
  status: "open" | "filled" | "archived";
}

export const useCollaboratorPosts = () => {
  const { userProfile } = useAuth();
  const [posts, setPosts] = useState<CollaboratorPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
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
        APPWRITE_COLLABORATORS_COLLECTION_ID,
        [Query.equal("collegeName", userProfile.collegeName), Query.orderDesc("$createdAt")]
      );
      setPosts(response.documents as unknown as CollaboratorPost[]);
    } catch (err: any) {
      console.error("Error fetching collaborator posts:", err);
      setError(err.message || "Failed to fetch collaborator posts.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName]);

  useEffect(() => {
    fetchPosts();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_COLLABORATORS_COLLECTION_ID}.documents`,
      (response) => {
        if (response.events.includes("databases.*.collections.*.documents.*.create")) {
          setPosts((prev) => [response.payload as unknown as CollaboratorPost, ...prev]);
        } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
          setPosts((prev) =>
            prev.map((post) =>
              post.$id === (response.payload as CollaboratorPost).$id
                ? (response.payload as unknown as CollaboratorPost)
                : post
            )
          );
        } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
          setPosts((prev) =>
            prev.filter((post) => post.$id !== (response.payload as CollaboratorPost).$id)
          );
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchPosts]);

  const createPost = async (postData: Omit<CollaboratorPost, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "posterId" | "posterName" | "collegeName" | "status">) => {
    if (!userProfile) {
      toast.error("User profile not available.");
      return;
    }
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLABORATORS_COLLECTION_ID,
        ID.unique(),
        { ...postData, posterId: userProfile.userId, posterName: userProfile.name, collegeName: userProfile.collegeName, status: "open" }
      );
      toast.success("Collaborator post created successfully!");
    } catch (err: any) {
      console.error("Error creating collaborator post:", err);
      toast.error(err.message || "Failed to create collaborator post.");
    }
  };

  const updatePostStatus = async (postId: string, status: CollaboratorPost["status"]) => {
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLABORATORS_COLLECTION_ID,
        postId,
        { status }
      );
      toast.success(`Collaborator post ${postId} status updated to ${status}!`);
    } catch (err: any) {
      console.error("Error updating collaborator post status:", err);
      toast.error(err.message || "Failed to update collaborator post status.");
    }
  };

  return {
    posts,
    isLoading,
    error,
    refetchPosts: fetchPosts,
    createPost,
    updatePostStatus,
  };
};