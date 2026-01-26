"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  MessageSquareText, Send, QrCode, Code, Loader2, Clock, 
  Info, AlertTriangle, ShieldCheck, HeartHandshake, ChevronDown, ChevronUp 
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_DEVELOPER_MESSAGES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import { containsBlockedWords } from "@/lib/moderation";
import { calculateCommissionRate, formatCommissionRate } from "@/utils/commission";
import { DEVELOPER_UPI_ID } from "@/lib/config";
import ContributionStoryDialog from "./ContributionStoryDialog";
import { useDeveloperMessages } from "@/hooks/useDeveloperMessages";

const DeveloperChatbox = () => {
  const { user, userProfile } = useAuth();
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  
  // Fetch messages hook
  const { messages, isLoading: isMessagesLoading, error: messagesError, refetch: refetchMessages } = useDeveloperMessages(userProfile?.collegeName);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
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
      toast.error("Login required to participate.");
      return;
    }
    if (!userProfile.collegeName) {
      toast.error("Please update your profile with your college name first.");
      return;
    }
    
    if (containsBlockedWords(trimmedMessage)) {
      toast.error("Message contains restricted words. Please maintain decorum.");
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
      toast.success("Message posted successfully.");
      refetchMessages(); 
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="bg-card text-card-foreground shadow-xl border-border overflow-hidden flex flex-col h-full max-h-[85vh]">
      
      {/* HEADER */}
      <CardHeader className="p-4 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-secondary-neon" /> Developer Connect
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-1">
              Direct line to the Natpe Thunai team & Campus Admin.
            </CardDescription>
          </div>
          {/* Quick link to contribution */}
          <Button variant="ghost" size="icon" onClick={() => setIsContributionDialogOpen(true)} title="Contribute">
             <Code className="h-5 w-5 text-muted-foreground hover:text-secondary-neon transition-colors" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col flex-1 overflow-hidden">
        
        {/* GUIDELINES BANNER */}
        <div className="p-4 bg-blue-500/10 border-b border-blue-500/20">
            <div className="flex gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">Community Guidelines</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        This chat is <strong>public</strong> to all students in your college. Feel free to:
                        <ul className="list-disc list-inside mt-1 ml-1 space-y-0.5">
                            <li>Suggest new features 💡</li>
                            <li>Report bugs or glitches 🐛</li>
                            <li>Report user misbehavior 🚩</li>
                        </ul>
                        <span className="block mt-1 font-medium text-foreground/80">
                            Please be polite and maintain strict decorum.
                        </span>
                    </p>
                </div>
            </div>
        </div>

        {/* CHAT AREA */}
        <div 
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/50 backdrop-blur-sm" 
            ref={chatContainerRef}
        >
          {isMessagesLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
              <Loader2 className="h-8 w-8 animate-spin text-secondary-neon" />
              <p className="text-sm font-medium">Syncing conversations...</p>
            </div>
          ) : messagesError ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-destructive p-4 text-center">
              <AlertTriangle className="h-8 w-8" />
              <p className="text-sm">Unable to load chat. Please check your connection.</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
              <div className="bg-muted p-4 rounded-full mb-3">
                 <MessageSquareText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">It's quiet here...</p>
              <p className="text-xs text-muted-foreground">Be the first to say hello or report an issue!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === user?.$id;
              const isDev = msg.isDeveloper; // Assuming this field exists in your hook data

              return (
                <div key={msg.$id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[85%] md:max-w-[70%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    {/* Avatar */}
                    <Avatar className="h-8 w-8 border-2 border-background shadow-sm mt-1">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${msg.senderName}`} />
                      <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                        {msg.senderName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Message Bubble */}
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                       {/* Name Label */}
                       {!isMe && (
                           <span className={`text-[10px] font-bold mb-1 ml-1 ${isDev ? 'text-secondary-neon flex items-center gap-1' : 'text-muted-foreground'}`}>
                               {msg.senderName} {isDev && <ShieldCheck className="h-3 w-3" />}
                           </span>
                       )}

                       <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm relative ${
                           isMe 
                             ? 'bg-secondary-neon text-primary-foreground rounded-tr-sm' 
                             : isDev 
                                ? 'bg-primary/10 border border-primary/20 text-foreground rounded-tl-sm'
                                : 'bg-muted text-foreground rounded-tl-sm'
                       }`}>
                          {msg.message}
                       </div>
                       
                       {/* Timestamp */}
                       <span className="text-[9px] text-muted-foreground mt-1 px-1 flex items-center gap-1">
                          {new Date(msg.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* INPUT AREA */}
        <div className="p-3 bg-card border-t border-border">
          <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your suggestion or report..."
              className="flex-grow min-h-[44px] bg-muted/50 border-transparent focus:border-secondary-neon focus:bg-background transition-all"
              disabled={isSending}
            />
            <Button 
                type="submit" 
                size="icon" 
                className="h-11 w-11 shrink-0 rounded-xl bg-secondary-neon text-primary-foreground shadow-lg hover:shadow-secondary-neon/20 hover:scale-105 transition-all" 
                disabled={isSending || !message.trim()}
            >
              {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
            </Button>
          </form>
        </div>

        {/* FOOTER: COLLAPSIBLE INFO */}
        <div className="border-t border-border bg-muted/10">
            <Collapsible open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full flex justify-between items-center px-4 py-3 h-auto text-xs font-medium text-muted-foreground hover:text-foreground">
                        <span className="flex items-center gap-2">
                            <QrCode className="h-4 w-4" /> 
                            Developer Payments & Commission ({dynamicCommissionRateDisplay})
                        </span>
                        {isPaymentOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 animate-in slide-in-from-top-2">
                    <div className="p-3 bg-background rounded-lg border border-border shadow-sm flex flex-col sm:flex-row gap-4 items-center">
                        <div className="shrink-0 bg-white p-1 rounded-md">
                             <a href="/qr.jpg" download="NatpeThunai_QR.jpg">
                                <img src="/qr.jpg" alt="QR" className="w-20 h-20 object-contain" />
                             </a>
                        </div>
                        <div className="space-y-1 text-center sm:text-left">
                            <p className="text-xs font-semibold text-foreground">Official UPI: <span className="font-mono text-secondary-neon select-all">{DEVELOPER_UPI_ID}</span></p>
                            <p className="text-[10px] text-muted-foreground leading-snug">
                                All transaction payments are routed here first. We deduct the platform fee automatically and forward the rest to the seller.
                            </p>
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>

      </CardContent>

      {/* DIALOGS */}
      <ContributionStoryDialog isOpen={isContributionDialogOpen} onClose={() => setIsContributionDialogOpen(false)} />
    </Card>
  );
};

export default DeveloperChatbox;