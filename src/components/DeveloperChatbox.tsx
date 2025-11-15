"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquareText, Send, QrCode, Users, HeartHandshake, Code, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import JoinAmbassadorForm from "@/components/forms/JoinAmbassadorForm";
import { Separator } from "@/components/ui/separator";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import { containsBlockedWords } from "@/lib/moderation"; // Import moderation utility

const DeveloperChatbox = () => {
  const { user, userProfile } = useAuth();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

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
          // Note: The $createdAt timestamp will be used by the Developer Dashboard
          // to determine visibility (1-2 days).
        }
      );
      setMessage("");
      toast.success("Message sent to developers! Check the Developer Dashboard for a response.");
    } catch (error: any) {
      console.error("Error sending message to developers:", error);
      toast.error(error.message || "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  const handleContribute = () => {
    toast.info("Redirecting to our contribution guidelines (feature coming soon)!");
    // In a real app, this would link to a GitHub repo, documentation, or a contact form.
  };

  const developerUpiId = "8903480105@superyes";

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
            For all transactions (buy, rent, services), users pay the developers first. We then deduct our 30% commission and transfer the remaining amount to the seller/service provider.
          </p>
          <div className="flex flex-col items-center space-y-2 p-3 border border-border rounded-md bg-background">
            <img src="/qr.jpg" alt="Developer UPI QR Code" className="w-32 h-32 object-contain rounded-md" />
            <p className="text-sm font-medium text-foreground">UPI ID: <span className="text-secondary-neon">{developerUpiId}</span></p>
            <p className="text-xs text-muted-foreground text-center">Scan or use this UPI ID for all payments.</p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Contribute to Application */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Code className="h-4 w-4 text-secondary-neon" /> Contribute to the Application
          </h3>
          <p className="text-sm text-muted-foreground">
            Help us improve Natpe🤝Thunai! We welcome contributions from the community.
          </p>
          <Button onClick={handleContribute} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Learn How to Contribute
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeveloperChatbox;