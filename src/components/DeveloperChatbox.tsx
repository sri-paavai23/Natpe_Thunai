import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from '@/context/AuthContext';
import { useDeveloperMessages, DeveloperMessage } from '@/hooks/useDeveloperMessages';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

interface DeveloperChatboxProps {
  collegeNameFilter?: string; // Optional prop to filter messages by college (for developer view)
}

const DeveloperChatbox: React.FC<DeveloperChatboxProps> = ({ collegeNameFilter }) => {
  const { user, userProfile, loading: isAuthLoading } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // NEW: Fetch messages using the hook, filtered by the user's college or the provided filter
  const { messages, isLoading: isMessagesLoading, error: messagesError, sendMessage, refetch: refetchMessages } = useDeveloperMessages(collegeNameFilter);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (!user || !userProfile) {
      toast.error("You must be logged in to send messages.");
      return;
    }
    if (!userProfile.collegeName && userProfile.role !== 'developer') { // Corrected property access and userType to role
      toast.error("Your profile is missing college information. Please update your profile first.");
      return;
    }

    try {
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (error) {
      // Error handled by useDeveloperMessages hook
    }
  };

  if (isAuthLoading || isMessagesLoading) {
    return (
      <Card className="bg-card border-border-dark text-foreground h-[400px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Developer Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
        </CardContent>
      </Card>
    );
  }

  if (messagesError) {
    return (
      <Card className="bg-card border-border-dark text-foreground h-[400px] flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Developer Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center text-destructive">
          <p>Error loading messages: {messagesError}</p>
          <Button onClick={refetchMessages} className="ml-2">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border-dark text-foreground h-[400px] flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Developer Chat {collegeNameFilter ? `(${collegeNameFilter})` : ''}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.$id}
                className={`flex ${msg.senderId === user?.$id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    msg.senderId === user?.$id
                      ? 'bg-primary-blue text-primary-foreground'
                      : msg.isDeveloper
                      ? 'bg-secondary-neon text-primary-blue'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <p className="text-xs font-semibold mb-1">
                    {msg.senderId === user?.$id ? 'You' : msg.senderName}
                    {msg.isDeveloper && <span className="ml-1 text-xs text-gray-700">(Developer)</span>}
                  </p>
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs text-right mt-1 opacity-70">
                    {new Date(msg.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t border-border-dark">
        <form onSubmit={handleSendMessage} className="flex w-full space-x-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 bg-background-dark border-border-dark text-foreground placeholder:text-muted-foreground"
            disabled={!user || !userProfile || (userProfile.role !== 'developer' && !userProfile.collegeName)}
          />
          <Button type="submit" disabled={!newMessage.trim() || !user || !userProfile || (userProfile.role !== 'developer' && !userProfile.collegeName)}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default DeveloperChatbox;