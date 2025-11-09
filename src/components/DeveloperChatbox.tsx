"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquareText, Send, QrCode, Users, HeartHandshake, Code } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import JoinAmbassadorForm from "@/components/forms/JoinAmbassadorForm"; // Import the new form
import { Separator } from "@/components/ui/separator"; // Import Separator

const DeveloperChatbox = () => {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<string[]>([]); // Placeholder for chat history
  const [isAmbassadorFormOpen, setIsAmbassadorFormOpen] = useState(false);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // In a real application, this message would be sent to a backend service
      // (e.g., Appwrite Functions, WebSockets, or a ticketing system).
      // For now, we'll simulate sending and add it to a local history.
      const newMessage = `You: ${message}`;
      setChatHistory((prev) => [...prev, newMessage]);
      setMessage("");
      toast.success("Message sent to developers!");

      // Simulate a developer response after a short delay
      setTimeout(() => {
        setChatHistory((prev) => [...prev, "Developer: Thanks for reaching out! We'll get back to you soon."]);
      }, 2000);
    } else {
      toast.error("Message cannot be empty.");
    }
  };

  const handleAmbassadorApply = (data: { name: string; email: string; mobile: string; whyJoin: string }) => {
    console.log("Ambassador Application:", data);
    toast.success("Ambassador application submitted! We'll review it shortly.");
    setIsAmbassadorFormOpen(false);
    // In a real app, this data would be sent to a backend for processing.
  };

  const handleContribute = () => {
    toast.info("Redirecting to our contribution guidelines (feature coming soon)!");
    // In a real app, this would link to a GitHub repo, documentation, or a contact form.
  };

  const developerUpiId = "8903480105@superyes"; // Updated developer UPI ID

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <MessageSquareText className="h-5 w-5 text-secondary-neon" /> Chat with Developers
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <p className="text-sm text-muted-foreground">
          Have a question or feedback? Chat directly with our development team!
        </p>
        <div className="h-40 overflow-y-auto border border-border rounded-md p-3 bg-background text-sm space-y-2">
          {chatHistory.length === 0 ? (
            <p className="text-muted-foreground text-center">No messages yet. Start a conversation!</p>
          ) : (
            chatHistory.map((msg, index) => (
              <p key={index} className={msg.startsWith("You:") ? "text-primary-foreground text-right" : "text-muted-foreground text-left"}>
                {msg}
              </p>
            ))
          )}
        </div>
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-grow bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          />
          <Button type="submit" size="icon" className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            <Send className="h-4 w-4" />
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

        {/* Ambassador Section */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-secondary-neon" /> Become an Ambassador
          </h3>
          <p className="text-sm text-muted-foreground">
            Our ambassadors facilitate deliveries and ensure smooth transactions. Join our team!
          </p>
          <p className="text-sm text-muted-foreground">
            Contact our Ambassador Coordinator: <span className="font-medium text-foreground">ambassador.lead@example.com</span>
          </p>
          <Dialog open={isAmbassadorFormOpen} onOpenChange={setIsAmbassadorFormOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <HeartHandshake className="mr-2 h-4 w-4" /> Join as an Ambassador
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Ambassador Application</DialogTitle>
              </DialogHeader>
              <JoinAmbassadorForm onApply={handleAmbassadorApply} onCancel={() => setIsAmbassadorFormOpen(false)} />
            </DialogContent>
          </Dialog>
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