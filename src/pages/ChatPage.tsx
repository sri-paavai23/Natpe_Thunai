"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquareText, Send, ArrowLeft, User } from "lucide-react";
import { toast } from "sonner";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CHAT_ROOMS_COLLECTION_ID, APPWRITE_CHAT_MESSAGES_COLLECTION_ID } from "@/lib/appwrite";
import { Models, ID, Query } from "appwrite";
import { useAuth } from "@/context/AuthContext";
import * as Ably from "ably";
import { ChatClient, ConnectionStatusChange, ChatMessageEvent, RoomStatusChange } from "@ably/chat";
import { cn } from "@/lib/utils";

interface ChatRoom extends Models.Document {
  transactionId: string;
  serviceId: string;
  buyerId: string;
  providerId: string;
  buyerUsername: string;
  providerUsername: string;
  status: "active" | "closed";
  collegeName: string;
}

interface ChatMessage extends Models.Document {
  chatRoomId: string;
  senderId: string;
  senderUsername: string;
  content: string;
}

const ChatPage = () => {
  const { chatRoomId } = useParams<{ chatRoomId: string }>();
  const navigate = useNavigate();
  const { user, userProfile, isLoading: isAuthLoading } = useAuth();

  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [ablyClient, setAblyClient] = useState<Ably.Realtime | null>(null);
  const [chatClient, setChatClient] = useState<ChatClient | null>(null);
 // Use 'Ably.RealtimeChannel' directly
const [ablyRoom, setAblyRoom] = useState<Ably.RealtimeChannel | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const fetchAblyToken = useCallback(async (userId: string, channelName: string) => {
    try {
      // Call your Appwrite Function to get an Ably token
      const response = await fetch(`${import.meta.env.VITE_APPWRITE_ENDPOINT}/functions/generateAblyToken/executions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': import.meta.env.VITE_APPWRITE_PROJECT_ID,
          // No API key here, as the function is public or uses internal permissions
        },
        body: JSON.stringify({ userId, channelName }),
      });

      const data = await response.json();
      if (data.success && data.tokenRequest) {
        return data.tokenRequest;
      } else {
        throw new Error(data.error || "Failed to get Ably token from function.");
      }
    } catch (error) {
      console.error("Error fetching Ably token:", error);
      toast.error("Failed to establish chat connection. Please try again.");
      return null;
    }
  }, []);

  // Fetch chat room and messages, and set up Ably connection
  useEffect(() => {
    if (isAuthLoading || !user || !chatRoomId) return;

    const setupChat = async () => {
      setIsLoadingChat(true);
      try {
        // 1. Fetch Chat Room details
        const roomDoc = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_CHAT_ROOMS_COLLECTION_ID,
          chatRoomId
        ) as unknown as ChatRoom;

        if (!roomDoc || (roomDoc.buyerId !== user.$id && roomDoc.providerId !== user.$id)) {
          toast.error("You do not have access to this chat room.");
          navigate("/services", { replace: true });
          return;
        }
        setChatRoom(roomDoc);

        // 2. Fetch existing messages
        const messagesResponse = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_CHAT_MESSAGES_COLLECTION_ID,
          [
            Query.equal('chatRoomId', chatRoomId),
            Query.orderAsc('$createdAt'),
          ]
        );
        setMessages(messagesResponse.documents as unknown as ChatMessage[]);

        // 3. Get Ably Token
        const ablyTokenRequest = await fetchAblyToken(user.$id, `chat-${chatRoomId}`);
        if (!ablyTokenRequest) {
          setIsLoadingChat(false);
          return;
        }

        // 4. Initialize Ably Realtime and ChatClient
        const ablyRealtime = new Ably.Realtime({
          authUrl: `${import.meta.env.VITE_APPWRITE_ENDPOINT}/functions/generateAblyToken/executions`,
          authMethod: 'POST',
          authParams: { userId: user.$id, channelName: `chat-${chatRoomId}` },
          clientId: user.$id,
          echoMessages: false, // Prevent receiving own messages twice
        });
        setAblyClient(ablyRealtime);

        const chat = new ChatClient(ablyRealtime);
        setChatClient(chat);

        // 5. Get and attach to Ably Room
        const room = await chat.rooms.get(`chat-${chatRoomId}`);
        setAblyRoom(room);

        room.messages.subscribe((message: ChatMessageEvent) => {
          // Only process messages from other users, as our own messages are added directly
          if (message.message.clientId !== user.$id) {
            setMessages(prev => [...prev, {
              $id: ID.unique(), // Ably message doesn't have Appwrite ID
              chatRoomId: chatRoomId,
              senderId: message.message.clientId || 'unknown',
              senderUsername: message.message.data.senderUsername || 'Anonymous',
              content: message.message.text,
              $createdAt: new Date().toISOString(),
              $updatedAt: new Date().toISOString(),
              $permissions: [],
              $collectionId: APPWRITE_CHAT_MESSAGES_COLLECTION_ID,
              $databaseId: APPWRITE_DATABASE_ID,
              $sequence: 0,
            }]);
          }
        });
        await room.attach();

        // 6. Set up Appwrite real-time subscription for chat messages (for persistence)
        const unsubscribeAppwrite = databases.client.subscribe(
          `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_CHAT_MESSAGES_COLLECTION_ID}.documents`,
          (response) => {
            const payload = response.payload as unknown as ChatMessage;
            if (payload.chatRoomId === chatRoomId && payload.senderId !== user.$id) {
              // If a message is created by another user and stored in Appwrite,
              // we might receive it here. We already handle Ably messages,
              // so this is primarily for ensuring our local state is consistent with persisted data.
              // For simplicity, we'll let Ably drive the real-time display and Appwrite for history.
              // If Ably messages are not persisted, this would be the primary real-time update.
            }
          }
        );

        setIsLoadingChat(false);
        return () => {
          unsubscribeAppwrite();
          ablyRoom?.detach();
          ablyClient?.close();
        };

      } catch (error: any) {
        console.error("Error setting up chat:", error);
        toast.error(error.message || "Failed to load chat. Please ensure your Appwrite collections are configured and permissions are correct.");
        setIsLoadingChat(false);
        navigate("/services", { replace: true });
      }
    };

    setupChat();

    return () => {
      ablyRoom?.detach();
      ablyClient?.close();
    };
  }, [isAuthLoading, user, chatRoomId, navigate, fetchAblyToken]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();

    if (!trimmedMessage || !user || !chatRoom || !ablyRoom) {
      toast.error("Cannot send empty message or chat not ready.");
      return;
    }

    setIsSendingMessage(true);
    try {
      const senderUsername = user.name; // Use Appwrite user.name as the anonymous username

      // 1. Publish message to Ably
      await ablyRoom.messages.publish('message', {
        text: trimmedMessage,
        senderUsername: senderUsername,
      });

      // 2. Store message in Appwrite for history
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CHAT_MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          chatRoomId: chatRoomId!,
          senderId: user.$id,
          senderUsername: senderUsername,
          content: trimmedMessage,
        }
      );

      // Add own message to local state immediately
      setMessages(prev => [...prev, {
        $id: ID.unique(),
        chatRoomId: chatRoomId!,
        senderId: user.$id,
        senderUsername: senderUsername,
        content: trimmedMessage,
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        $permissions: [],
        $collectionId: APPWRITE_CHAT_MESSAGES_COLLECTION_ID,
        $databaseId: APPWRITE_DATABASE_ID,
        $sequence: 0,
      }]);

      setNewMessage("");
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (isLoadingChat || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-secondary-neon" />
        <p className="ml-3 text-lg text-muted-foreground">Loading chat...</p>
      </div>
    );
  }

  if (!chatRoom || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <h1 className="text-4xl font-bold mb-4">Chat Not Found</h1>
        <Button onClick={() => navigate("/services")} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go to Services
        </Button>
      </div>
    );
  }

  const isBuyer = user.$id === chatRoom.buyerId;
  const otherParticipantUsername = isBuyer ? chatRoom.providerUsername : chatRoom.buyerUsername;
  const currentUserUsername = isBuyer ? chatRoom.buyerUsername : chatRoom.providerUsername;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate("/services")} className="text-muted-foreground hover:text-secondary-neon">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
        </Button>
        
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-secondary-neon" /> Chat with {otherParticipantUsername}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Service: {chatRoom.serviceId}</p>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div ref={chatContainerRef} className="space-y-3 max-h-96 overflow-y-auto p-3 border border-border rounded-md bg-background">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Start a conversation!</p>
              ) : (
                messages.map((msg, index) => (
                  <div key={msg.$id || index} className={cn(
                    "flex",
                    msg.senderId === user.$id ? "justify-end" : "justify-start"
                  )}>
                    <div className={cn(
                      "max-w-[80%] p-2 rounded-lg",
                      msg.senderId === user.$id ? "bg-secondary-neon text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      <p className="text-xs font-semibold mb-1">
                        {msg.senderId === user.$id ? "You" : msg.senderUsername}
                      </p>
                      <p className="text-sm break-words">{msg.content}</p>
                      <p className="text-xs text-right mt-1 opacity-70">
                        {new Date(msg.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-grow bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                disabled={isSendingMessage}
              />
              <Button type="submit" size="icon" className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" disabled={isSendingMessage}>
                {isSendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="sr-only">Send Message</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ChatPage;