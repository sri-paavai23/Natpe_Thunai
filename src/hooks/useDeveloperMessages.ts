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
const DEVELOPER_MESSAGES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID;

export type MessageStatus = "Pending" | "Resolved" | "Archived";

export interface DeveloperMessage extends Models.Document { // Extend Models.Document
  senderId: string;
  senderName: string;
  collegeName: string;
  message: string;
  status: MessageStatus;
  response?: string; // Developer's response
  respondedBy?: string; // Developer's ID
  respondedAt?: string; // ISO date string
  $sequence: number; // Made $sequence required
}

export interface DeveloperMessagesState {
  messages: DeveloperMessage[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  postMessage: (messageData: Omit<DeveloperMessage, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "senderId" | "senderName" | "collegeName" | "status" | "response" | "respondedBy" | "respondedAt" | "$sequence">) => Promise<void>; // Omit $sequence
  updateMessageStatus: (messageId: string, newStatus: MessageStatus, response?: string) => Promise<void>;
}

export const useDeveloperMessages = (): DeveloperMessagesState => {
  const { user, userProfile } = useAuth();
  const [messages, setMessages] = useState<DeveloperMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queries = [
        Query.orderDesc('$createdAt'),
        // Only developers can see all messages, others only their own
        userProfile?.isDeveloper ? Query.limit(100) : Query.equal('senderId', user?.$id || 'invalid')
      ];

      const response = await databases.listDocuments(
        DATABASE_ID,
        DEVELOPER_MESSAGES_COLLECTION_ID,
        queries
      );
      setMessages(response.documents as DeveloperMessage[]); // Type assertion is now safer
    } catch (err: any) {
      console.error("Error fetching developer messages:", err);
      setError("Failed to fetch developer messages.");
      toast.error("Failed to load developer messages.");
    } finally {
      setIsLoading(false);
    }
  }, [user, userProfile?.isDeveloper]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const postMessage = async (messageData: Omit<DeveloperMessage, "$id" | "$createdAt" | "$updatedAt" | "$collectionId" | "$databaseId" | "$permissions" | "senderId" | "senderName" | "collegeName" | "status" | "response" | "respondedBy" | "respondedAt" | "$sequence">) => {
    if (!user || !userProfile?.collegeName) {
      toast.error("You must be logged in and have a college name set to send a message.");
      return;
    }

    try {
      const newMessage = await databases.createDocument(
        DATABASE_ID,
        DEVELOPER_MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          ...messageData,
          senderId: user.$id,
          senderName: user.name,
          collegeName: userProfile.collegeName,
          status: "Pending", // Default status
          $sequence: 0, // Provide a default for $sequence
        }
      );
      setMessages(prev => [newMessage as DeveloperMessage, ...prev]); // Type assertion is now safer
      toast.success("Message sent to developers!");
    } catch (err: any) {
      console.error("Error posting message:", err);
      toast.error(err.message || "Failed to send message.");
      throw err;
    }
  };

  const updateMessageStatus = async (messageId: string, newStatus: MessageStatus, response?: string) => {
    if (!user || !userProfile?.isDeveloper) {
      toast.error("You are not authorized to update message status.");
      return;
    }

    try {
      const dataToUpdate: Partial<DeveloperMessage> = { status: newStatus };
      if (response) {
        dataToUpdate.response = response;
        dataToUpdate.respondedBy = user.$id;
        dataToUpdate.respondedAt = new Date().toISOString();
      }

      const updatedMessage = await databases.updateDocument(
        DATABASE_ID,
        DEVELOPER_MESSAGES_COLLECTION_ID,
        messageId,
        dataToUpdate
      );
      setMessages(prev => prev.map(msg => msg.$id === messageId ? { ...msg, ...dataToUpdate } : msg));
      toast.success(`Message status updated to ${newStatus}!`);
    } catch (err: any) {
      console.error("Error updating message status:", err);
      toast.error(err.message || "Failed to update message status.");
      throw err;
    }
  };

  return {
    messages,
    isLoading,
    error,
    refetch: fetchMessages,
    postMessage,
    updateMessageStatus,
  };
};