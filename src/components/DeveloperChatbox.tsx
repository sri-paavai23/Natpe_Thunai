"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquareText, Send, QrCode, Users, HeartHandshake, Code, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import JoinAmbassadorForm from "@/components/forms/JoinAmbassadorForm";
import { Separator } from "@/components/ui/separator";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import { containsBlockedWords } from "@/lib/moderation"; // Import moderation utility
import { calculateCommissionRate, formatCommissionRate } from "@/utils/commission";
import { DEVELOPER_UPI_ID } from "@/lib/config"; // Import DEVELOPER_UPI_ID
import ContributionStoryDialog from "./ContributionStoryDialog"; // NEW: Import ContributionStoryDialog
import { useDeveloperMessages, DeveloperMessage } from "@/hooks/useDeveloperMessages"; // NEW: Import useDeveloperMessages

const DeveloperChatbox = () => {
  const { user, userProfile } = useAuth();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false);
  
  // NEW: Fetch messages using the hook, filtered by the user's college
  const { messages, isLoading: isMessagesLoading, error: messagesError, refetch: refetchMessages } = useDeveloperMessages(userProfile?.collegeName);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const userLevel = userProfile?.level ?? 1;
  const dynamicCommissionRateDisplay = formatCommissionRate(calculateCommissionRate(userLevel));

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      toast.error("Message cannot be empty.");
      return;
    }
    if (!user || !userProfile) {
      toast.error("You must be logged in to send a message.");
      return;
    }
    if (!userProfile.collegeName) {
      toast.error("Your profile is missing college information. Please update your profile first.");
      return;
    }
    
    if (containsBlockedWords(trimmedMessage)) {
      toast.error("Your message contains inappropriate language. Please revise.");
      return;
    }

    setIsSending(true);
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          senderId: user.$id,
          senderName: user.name,
          message: trimmedMessage,
          isDeveloper: userProfile.role === 'developer',
          collegeName: userProfile.collegeName,
        }
      );
      setMessage("");
      toast.success("Message sent to developers! Check here for a response.");
      refetchMessages(); // Refetch messages to show the new one immediately
    } catch (error: any) {
      console.error("Error sending message to developers:", error);
      toast.error(error.message || "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <MessageSquareText className="h-5 w-5 text-secondary-neon" /> Chat with Developers
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <p className="text-sm text-muted-foreground">
          Have a question or feedback? Send a message directly to our development team!
        </p>

        {/* NEW: Conversation History */}
        <div className="space-y-2 border border-border rounded-md p-3 bg-background max-h-60 overflow-y-auto" ref={chatContainerRef}>
          {isMessagesLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
              <p className="ml-3 text-muted-foreground">Loading messages...</p>
            </div>
          ) : messagesError ? (
            <p className="text-center text-destructive py-4">Error loading messages: {messagesError}</p>
          ) : messages.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No recent messages. Start a conversation!</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.$id} className={`flex ${msg.senderId === user?.$id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-2 rounded-lg ${msg.senderId === user?.$id ? 'bg-secondary-neon text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <p className="text-xs font-semibold mb-1">
                    {msg.senderId === user?.$id ? 'You' : msg.senderName}
                  </p>
                  <p className="text-sm break-words">{msg.message}</p>
                  <p className="text-xs text-right mt-1 opacity-70">
                    {new Date(msg.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" /> Messages are visible for 48 hours.
        </p>
        
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-grow bg-input text-foreground border-border focus:ring-ring focus:border-ring"
            disabled={isSending}
          />
          <Button type="submit" size="icon" className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" disabled={isSending}>
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send Message</span>
          </Button>
        </form>

        <Separator className="my-4" />

        {/* Developer UPI Info */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <QrCode className="h-4 w-4 text-secondary-neon" /> Developer Payments
          </h3>
          <p className="text-sm text-muted-foreground">
            For all transactions (buy, rent, services), users pay the developers first. We then deduct the dynamic commission rate (currently {dynamicCommissionRateDisplay} for Level {userLevel}) and transfer the remaining amount to the seller/service provider.
          </p>
          <div className="flex flex-col items-center space-y-2 p-3 border border-border rounded-md bg-background">
            <a href="/qr.jpg" download="NatpeThunai_Developer_UPI_QR.jpg" className="cursor-pointer hover:opacity-80 transition-opacity">
              <img src="/qr.jpg" alt="Developer UPI QR Code" className="w-32 h-32 object-contain rounded-md" />
            </a>
            <p className="text-sm font-medium text-foreground">UPI ID: <span className="text-secondary-neon">{DEVELOPER_UPI_ID}</span></p>
            <p className="text-xs text-muted-foreground text-center">Click the QR code to download or use this UPI ID for all payments.</p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Contribute to Application */}
        <div className="space-y-3">
          <h3 className="lg font-semibold text-foreground flex items-center gap-2">
            <Code className="h-4 w-4 text-secondary-neon" /> Contribute to the Application
          </h3>
          <p className="text-sm text-muted-foreground">
            Help us improve Natpe🤝Thunai! We welcome contributions from the community.
          </p>
          <Button onClick={() => setIsContributionDialogOpen(true)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Learn How to Contribute
          </Button>
        </div>
      </CardContent>
      <ContributionStoryDialog isOpen={isContributionDialogOpen} onClose={() => setIsContributionDialogOpen(false)} />
    </Card>
  );
};

export default DeveloperChatbox;