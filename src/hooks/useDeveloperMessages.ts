"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';
import { toast } from 'sonner';

export interface DeveloperMessage extends Models.Document {
  senderId: string;
  senderName: string;
  message: string;
  isDeveloper: boolean;
}

interface DeveloperMessagesState {
  messages: DeveloperMessage[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// 48 hours in milliseconds
const VISIBILITY_DURATION_MS = 48 * 60 * 60 * 1000; 

// Client-side filter for time-limited visibility
const filterRecentMessages = (messages: DeveloperMessage[]): DeveloperMessage[] => {
  const cutoffTime = Date.now() - VISIBILITY_DURATION_MS;
  return messages.filter(msg => new Date(msg.$createdAt).getTime() >= cutoffTime);
};

export const useDeveloperMessages = (): DeveloperMessagesState => {
  const [allMessages, setAllMessages] = useState<DeveloperMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all messages, ordered by creation time descending
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID,
        [Query.orderDesc('$createdAt')]
      );
      
      setAllMessages(response.documents as unknown as DeveloperMessage[]);
    } catch (err: any) {
      console.error("Error fetching developer messages:", err);
      setError(err.message || "Failed to load developer messages.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as DeveloperMessage;

        setAllMessages(prev => {
          const existingIndex = prev.findIndex(m => m.$id === payload.$id);

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1) {
              toast.info(`New message from ${payload.senderName} received.`);
              return [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              return prev.map(m => m.$id === payload.$id ? payload : m);
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            if (existingIndex !== -1) {
              return prev.filter(m => m.$id !== payload.$id);
            }
          }
          return prev;
        });
      }
    );

    // Set up a timer to periodically refetch/re-filter to handle the 48h cutoff
    const intervalId = setInterval(() => {
        setAllMessages(prev => [...prev]); // Trigger re-render/re-filter
    }, 60000); // Check every minute

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [fetchMessages]);

  // Apply the 48-hour filter before returning
  const recentMessages = filterRecentMessages(allMessages);

  return { messages: recentMessages, isLoading, error, refetch: fetchMessages };
};