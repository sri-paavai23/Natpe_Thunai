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
const COLLABORATOR_POSTS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLABORATOR_POSTS_COLLECTION_ID;

export type ProjectCategory = "Academic" | "Startup" | "Event" | "Research" | "Other";
export type ProjectStatus = "Open" | "Ongoing" | "Completed" | "Closed";

export interface CollaboratorPost extends Models.Document { // Extend Models.Document
  title: string;
  description: string;
  category: ProjectCategory;
  skillsNeeded: string[]; // e.g., ["React", "Node.js", "UI/UX"]
  contactInfo: string;
  posterId: string;
  posterName: string;
  collegeName: string;
  status: ProjectStatus;
  imageUrl?: string;
  $sequence: number; // Made $sequence required
}

interface CollaboratorPostsState {
  posts: CollaboratorPost[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  postProject: (postData: Omit<CollaboratorPost, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "posterId" | "posterName" | "collegeName" | "status" | "$sequence">) => Promise<void>; // Omit $sequence
  updatePostStatus: (postId: string, newStatus: ProjectStatus) => Promise<void>;
}

export const useCollaboratorPosts = (): CollaboratorPostsState => {
  const { userProfile } = useAuth();
  const [posts, setPosts] = useState<CollaboratorPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queries = [
        Query.orderDesc('$createdAt'),
        userProfile?.collegeName ? Query.equal('collegeName', userProfile.collegeName) : Query.limit(100) // Filter by college if available
      ];

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLABORATOR_POSTS_COLLECTION_ID,
        queries
      );
      setPosts(response.documents as CollaboratorPost[]); // Type assertion is now safer
    } catch (err: any) {
      console.error("Error fetching collaborator posts:", err);
      setError("Failed to fetch collaborator posts.");
      toast.error("Failed to load collaborator posts.");
    } finally {
      setIsLoading(false);
    }
  }, [userProfile?.collegeName]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const postProject = async (postData: Omit<CollaboratorPost, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "posterId" | "posterName" | "collegeName" | "status" | "$sequence">) => {
    if (!userProfile?.collegeName) {
      toast.error("You must be logged in and have a college name set to post a project.");
      return;
    }

    try {
      const newPost = await databases.createDocument(
        DATABASE_ID,
        COLLABORATOR_POSTS_COLLECTION_ID,
        ID.unique(),
        {
          ...postData,
          posterId: userProfile.$id!,
          posterName: userProfile.name,
          collegeName: userProfile.collegeName,
          status: "Open", // Default status
          $sequence: 0, // Provide a default for $sequence
        }
      );
      setPosts(prev => [newPost as CollaboratorPost, ...prev]); // Type assertion is now safer
      toast.success("Project posted successfully!");
    } catch (err: any) {
      console.error("Error posting project:", err);
      toast.error(err.message || "Failed to post project.");
      throw err;
    }
  };

  const updatePostStatus = async (postId: string, newStatus: ProjectStatus) => {
    if (!userProfile) {
      toast.error("You must be logged in to update a post.");
      return;
    }

    try {
      const updatedPost = await databases.updateDocument(
        DATABASE_ID,
        COLLABORATOR_POSTS_COLLECTION_ID,
        postId,
        { status: newStatus }
      );
      setPosts(prev => prev.map(post => post.$id === postId ? { ...post, status: newStatus } : post));
      toast.success(`Post status updated to ${newStatus}!`);
    } catch (err: any) {
      console.error("Error updating post status:", err);
      toast.error(err.message || "Failed to update post status.");
      throw err;
    }
  };

  return {
    posts,
    isLoading,
    error,
    refetch: fetchPosts,
    postProject,
    updatePostStatus,
  };
};