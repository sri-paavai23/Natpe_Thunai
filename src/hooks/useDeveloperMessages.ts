import { useState, useEffect, useCallback } from 'react';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID, client } from '@/lib/appwrite'; // Added client for subscribe
import { Models, Query, ID } from 'appwrite';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export interface DeveloperMessage extends Models.Document {
  senderId: string;
  senderName: string;
  message: string;
  isDeveloper: boolean;
  collegeName: string;
  $createdAt: string;
}

interface UseDeveloperMessagesState {
  messages: DeveloperMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (message: string) => Promise<void>;
  refetch: () => void;
}

export const useDeveloperMessages = (collegeNameFilter?: string): UseDeveloperMessagesState => {
  const { user, userProfile, loading: isAuthLoading } = useAuth();
  const [messages, setMessages] = useState<DeveloperMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (isAuthLoading) return;

    setIsLoading(true);
    setError(null);

    // The DeveloperDashboard will call this hook without a collegeNameFilter.
    // If a collegeNameFilter is provided and it doesn't match the user's college, and the user is not a developer,
    // then don't fetch messages. This prevents regular users from seeing other college's messages.
    if (collegeNameFilter && userProfile?.collegeName && collegeNameFilter !== userProfile.collegeName && userProfile.role !== 'developer') {
        setIsLoading(false);
        setMessages([]);
        return;
    }

    // If no filter is provided and user is not developer and has no college, don't fetch
    if (!collegeNameFilter && !userProfile?.collegeName && userProfile?.role !== 'developer') {
        setIsLoading(false);
        setMessages([]);
        return;
    }

    try {
      let queries = [
        Query.orderAsc('$createdAt'),
        Query.limit(100) // Fetch last 100 messages
      ];

      if (collegeNameFilter) {
        queries.push(Query.equal('collegeName', collegeNameFilter));
      } else if (userProfile?.role !== 'developer' && userProfile?.collegeName) { // For regular users, if no explicit filter is passed, use their collegeName
        queries.push(Query.equal('collegeName', userProfile.collegeName));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID,
        queries
      );
      setMessages(response.documents as unknown as DeveloperMessage[]); // Cast to unknown first
    } catch (err: any) {
      console.error("Error fetching developer messages:", err);
      setError(err.message || "Failed to fetch messages.");
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [collegeNameFilter, userProfile?.collegeName, userProfile?.role, isAuthLoading]); // NEW: Depend on collegeNameFilter and userProfile

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = useCallback(async (message: string) => {
    if (!user?.$id || !userProfile) {
      toast.error("You must be logged in to send messages.");
      return;
    }
    if (!userProfile.collegeName && userProfile.role !== 'developer') {
      toast.error("Your profile is missing college information. Please update your profile first.");
      return;
    }

    let targetCollegeName = collegeNameFilter;
    if (!targetCollegeName && userProfile.role !== 'developer' && userProfile.collegeName) {
        targetCollegeName = userProfile.collegeName;
    } else if (!targetCollegeName && userProfile.role === 'developer') {
        // Developers sending a message without a specific college filter might be a global message or an error.
        // For now, we'll prevent sending if no college is specified for a developer.
        toast.error("Developers must select a college to send a message to, or ensure their profile has a college.");
        return;
    }
    if (!targetCollegeName) {
        toast.error("Could not determine target college for message.");
        return;
    }


    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          senderId: user.$id,
          senderName: user.name,
          message: message,
          isDeveloper: userProfile.role === 'developer',
          collegeName: targetCollegeName,
        }
      );
      // Messages will be updated via real-time subscription
    } catch (err: any) {
      console.error("Error sending message:", err);
      toast.error(err.message || "Failed to send message.");
    }
  }, [user?.$id, user?.name, userProfile?.role, userProfile?.collegeName, collegeNameFilter]);

  // Real-time subscription
  useEffect(() => {
    let subscriptionFilterCollege = '';
    if (collegeNameFilter) {
        subscriptionFilterCollege = collegeNameFilter;
    } else if (userProfile?.role !== 'developer' && userProfile?.collegeName) {
        subscriptionFilterCollege = userProfile.collegeName;
    }

    if (!subscriptionFilterCollege && userProfile?.role !== 'developer') {
        // If not a developer and no college name is determined, don't subscribe
        return;
    }

    const unsubscribe = client.subscribe( // Corrected to client.subscribe
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as DeveloperMessage; // Cast to unknown first

        // Filter updates based on collegeName
        if (subscriptionFilterCollege && payload.collegeName !== subscriptionFilterCollege) {
            return;
        }

        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          setMessages(prev => [...prev, payload]);
        }
        // No update/delete expected for messages in this context, but can be added if needed
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchMessages, collegeNameFilter, userProfile?.collegeName, userProfile?.role]); // NEW: Depend on collegeNameFilter and userProfile

  return { messages, isLoading, error, sendMessage, refetch: fetchMessages };
};