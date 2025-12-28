import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/AuthContext';
import { useDeveloperMessages } from '@/hooks/useDeveloperMessages';
import { Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const DeveloperChatbox = () => {
  const { user, userProfile, isLoading: isAuthLoading } = useAuth(); // Use userProfile and isLoading
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const collegeName = userProfile?.collegeName;
  const { messages, isLoading, error, postMessage, refetch } = useDeveloperMessages(); // Use postMessage, removed collegeName arg

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (!user || !userProfile?.collegeName) {
      toast.error("You must be logged in and have a college name to send a message.");
      return;
    }

    try {
      await postMessage({
        message: message.trim(),
      });
      setMessage("");
      refetch(); // Refetch messages to show the new one
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message.");
    }
  };

  if (isAuthLoading) {
    return (
      <Card className="w-full">
        <CardHeader><CardTitle>Developer Chat</CardTitle></CardHeader>
        <CardContent className="flex justify-center items-center h-48">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="w-full">
        <CardHeader><CardTitle>Developer Chat</CardTitle></CardHeader>
        <CardContent className="text-center text-muted-foreground h-48 flex items-center justify-center">
          Please log in to chat with developers.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full flex flex-col h-[400px]">
      <CardHeader className="border-b">
        <CardTitle className="text-lg">Developer Chat</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 h-full flex items-center justify-center">
            Error loading messages: {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground h-full flex items-center justify-center">
            No messages yet. Send one to get started!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.$id}
              className={`flex ${msg.senderId === user.$id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${msg.senderId === user.$id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
              >
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {msg.senderName} - {format(new Date(msg.$createdAt), 'HH:mm')}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <CardFooter className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex w-full gap-2">
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1"
            disabled={!user}
          />
          <Button type="submit" size="icon" disabled={!user || !message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default DeveloperChatbox;