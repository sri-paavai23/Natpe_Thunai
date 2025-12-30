"use client";

import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext'; // NEW: Import useAuth

export interface DeveloperMessage extends Models.Document {
  senderId: string;
  senderName: string;
  message: string;
  isDeveloper: boolean;
  collegeName: string; // NEW: Add collegeName
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

export const useDeveloperMessages = (collegeNameFilter?: string): DeveloperMessagesState => { // NEW: Add collegeNameFilter parameter
  const { userProfile } = useAuth(); // NEW: Use useAuth to get current user's college
  const [allMessages, setAllMessages] = useState<DeveloperMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    // NEW: If a collegeNameFilter is provided, and it's not the current user's college,
    // or if the current user's college is not set, don't fetch.
    // This ensures regular users only see their college's messages.
    // The DeveloperDashboard will call this hook without a collegeNameFilter.
    if (collegeNameFilter && userProfile?.collegeName && collegeNameFilter !== userProfile.collegeName) {
        setIsLoading(false);
        setAllMessages([]);
        return;
    }
    if (!collegeNameFilter && !userProfile?.collegeName && userProfile?.role !== 'developer') {
        // If no filter is provided and user is not developer and has no college, don't fetch
        setIsLoading(false);
        setAllMessages([]);
        return;
    }


    setIsLoading(true);
    setError(null);
    
    try {
      const queries = [Query.orderDesc('$createdAt')];
      if (collegeNameFilter) { // NEW: Apply collegeName filter if provided
        queries.push(Query.equal('collegeName', collegeNameFilter));
      } else if (userProfile?.role !== 'developer' && userProfile?.collegeName) {
        // For regular users, if no explicit filter is passed, use their collegeName
        queries.push(Query.equal('collegeName', userProfile.collegeName));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID,
        queries
      );
      
      setAllMessages(response.documents as unknown as DeveloperMessage[]);
    } catch (err: any) {
      console.error("Error fetching developer messages:", err);
      setError(err.message || "Failed to load developer messages.");
    } finally {
      setIsLoading(false);
    }
  }, [collegeNameFilter, userProfile?.collegeName, userProfile?.role]); // NEW: Depend on collegeNameFilter and userProfile

  useEffect(() => {
    fetchMessages();

    // NEW: Determine subscription filter based on collegeNameFilter or userProfile
    let subscriptionFilterCollege = '';
    if (collegeNameFilter) {
        subscriptionFilterCollege = collegeNameFilter;
    } else if (userProfile?.role !== 'developer' && userProfile?.collegeName) {
        subscriptionFilterCollege = userProfile.collegeName;
    }

    // Only subscribe if there's a valid college to filter by, or if it's a developer viewing all
    if (!subscriptionFilterCollege && userProfile?.role !== 'developer') return;

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as DeveloperMessage;

        // NEW: Filter real-time updates by collegeName if a filter is active
        if (subscriptionFilterCollege && payload.collegeName !== subscriptionFilterCollege) {
            return;
        }

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
  }, [fetchMessages, collegeNameFilter, userProfile?.collegeName, userProfile?.role]); // NEW: Depend on collegeNameFilter and userProfile

  // Apply the 48-hour filter before returning
  const recentMessages = filterRecentMessages(allMessages);

  return { messages: recentMessages, isLoading, error, refetch: fetchMessages };
};