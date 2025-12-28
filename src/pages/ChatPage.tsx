import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, Send, MessageSquare, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Client, Databases, Query, Models, ID } from 'appwrite';
import { toast } from 'sonner';

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

// Collection IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const CHAT_MESSAGES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CHAT_MESSAGES_COLLECTION_ID;
const CHAT_ROOMS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_CHAT_ROOMS_COLLECTION_ID;

export interface ChatMessage extends Models.Document {
  roomId: string;
  senderId: string;
  senderName: string;
  message: string;
}

export interface ChatRoom extends Models.Document {
  participants: string[]; // Array of user IDs
  participantNames: string[]; // Array of user names
  lastMessage?: string;
  lastMessageAt?: string; // ISO date string
}

const ChatPage = () => {
  const { roomId: paramRoomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const { user, userProfile, isLoading: isAuthLoading } = useAuth();
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(paramRoomId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChatRooms = useCallback(async () => {
    setIsLoadingRooms(true);
    if (!user) {
      setIsLoadingRooms(false);
      return;
    }
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CHAT_ROOMS_COLLECTION_ID,
        [
          Query.search('participants', user.$id),
          Query.orderDesc('lastMessageAt'),
        ]
      );
      setChatRooms(response.documents as ChatRoom[]);
    } catch (err) {
      console.error("Error fetching chat rooms:", err);
      toast.error("Failed to load chat rooms.");
    } finally {
      setIsLoadingRooms(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async (roomId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION_ID,
        [
          Query.equal('roomId', roomId),
          Query.orderAsc('$createdAt'),
          Query.limit(100), // Fetch last 100 messages
        ]
      );
      setMessages(response.documents as ChatMessage[]);
    } catch (err) {
      console.error("Error fetching messages:", err);
      toast.error("Failed to load messages.");
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      toast.error("You must be logged in to access chat.");
      navigate('/login');
      return;
    }
    if (user) {
      fetchChatRooms();
    }
  }, [user, isAuthLoading, fetchChatRooms, navigate]);

  useEffect(() => {
    if (currentRoomId) {
      fetchMessages(currentRoomId);
      navigate(`/chat/${currentRoomId}`);
    } else {
      setMessages([]);
    }
  }, [currentRoomId, fetchMessages, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !currentRoomId) return;

    try {
      const messagePayload = {
        roomId: currentRoomId,
        senderId: user.$id,
        senderName: user.name,
        message: newMessage.trim(),
      };

      const createdMessage = await databases.createDocument(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION_ID,
        ID.unique(),
        messagePayload
      );

      // Update local state
      setMessages(prev => [...prev, createdMessage as ChatMessage]);
      setNewMessage("");

      // Update chat room's last message
      await databases.updateDocument(
        DATABASE_ID,
        CHAT_ROOMS_COLLECTION_ID,
        currentRoomId,
        {
          lastMessage: newMessage.trim(),
          lastMessageAt: new Date().toISOString(),
        }
      );
      fetchChatRooms(); // Refresh rooms to update last message/time
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message.");
    }
  };

  const handleCreateOrSelectRoom = async (targetUserId: string, targetUserName: string) => {
    if (!user) {
      toast.error("You must be logged in to start a chat.");
      return;
    }
    if (targetUserId === user.$id) {
      toast.message("You cannot chat with yourself."); // Changed from toast.info
      return;
    }

    // Check if a room already exists between these two users
    const existingRoom = chatRooms.find(room =>
      room.participants.includes(user.$id) && room.participants.includes(targetUserId) && room.participants.length === 2
    );

    if (existingRoom) {
      setCurrentRoomId(existingRoom.$id);
    } else {
      // Create new room
      try {
        const newRoom = await databases.createDocument(
          DATABASE_ID,
          CHAT_ROOMS_COLLECTION_ID,
          ID.unique(),
          {
            participants: [user.$id, targetUserId],
            participantNames: [user.name, targetUserName],
            lastMessage: "New chat started.",
            lastMessageAt: new Date().toISOString(),
          }
        );
        setCurrentRoomId(newRoom.$id);
        fetchChatRooms(); // Refresh rooms to include the new one
        toast.success("New chat room created!");
      } catch (err) {
        console.error("Error creating chat room:", err);
        toast.error("Failed to create chat room.");
      }
    }
  };

  if (isAuthLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!user) {
    return null; // Redirect handled by useEffect
  }

  const currentChatRoom = chatRooms.find(room => room.$id === currentRoomId);
  const otherParticipant = currentChatRoom?.participants.find(pId => pId !== user.$id);
  const otherParticipantName = currentChatRoom?.participantNames[currentChatRoom.participants.indexOf(otherParticipant!)];

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-64px)] flex">
      {/* Chat Rooms Sidebar */}
      <Card className="w-1/4 min-w-[250px] mr-4 flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5" /> Chats
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          <ScrollArea className="h-full">
            {isLoadingRooms ? (
              <div className="p-4 text-center text-muted-foreground">Loading rooms...</div>
            ) : chatRooms.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No active chats.</div>
            ) : (
              chatRooms.map(room => {
                const otherUserIndex = room.participants.indexOf(user.$id) === 0 ? 1 : 0;
                const displayUserName = room.participantNames[otherUserIndex];
                return (
                  <div
                    key={room.$id}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted ${currentRoomId === room.$id ? 'bg-accent' : ''}`}
                    onClick={() => setCurrentRoomId(room.$id)}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>{displayUserName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{displayUserName}</p>
                      <p className="text-xs text-muted-foreground truncate">{room.lastMessage}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {room.lastMessageAt ? new Date(room.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                );
              })
            )}
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t">
          <Button className="w-full" onClick={() => toast.message("Feature to search/start new chat coming soon!")}>
            <User className="h-4 w-4 mr-2" /> Start New Chat
          </Button>
        </CardFooter>
      </Card>

      {/* Chat Window */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="text-lg">
            {currentChatRoom ? (
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{otherParticipantName ? otherParticipantName[0] : '?'}</AvatarFallback>
                </Avatar>
                {otherParticipantName}
              </div>
            ) : (
              "Select a chat or start a new one"
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoadingMessages ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : messages.length === 0 && currentRoomId ? (
            <div className="text-center text-muted-foreground h-full flex items-center justify-center">
              Start your conversation!
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.$id}
                className={`flex ${msg.senderId === user.$id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-end gap-2 max-w-[70%] ${msg.senderId === user.$id ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{msg.senderName[0]}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`p-3 rounded-lg ${msg.senderId === user.$id ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'}`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(msg.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        <CardFooter className="border-t p-4">
          {currentRoomId ? (
            <form onSubmit={handleSendMessage} className="flex w-full gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <p className="text-muted-foreground w-full text-center">Select a chat to send messages.</p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default ChatPage;