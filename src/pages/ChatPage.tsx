"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Loader2, Send, ArrowLeft, ShieldCheck, AlertTriangle, 
  Info, MoreVertical, Link2, Cloud, Plus, Image as ImageIcon, X 
} from "lucide-react";
import { toast } from "sonner";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  databases, 
  APPWRITE_DATABASE_ID, 
  APPWRITE_CHAT_ROOMS_COLLECTION_ID, 
  APPWRITE_CHAT_MESSAGES_COLLECTION_ID,
  APPWRITE_REPORTS_COLLECTION_ID,
  APPWRITE_USER_PROFILES_COLLECTION_ID // Ensure this is exported from your lib/appwrite file
} from "@/lib/appwrite";
import { Models, ID, Query } from "appwrite";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { MadeWithDyad } from "@/components/made-with-dyad";
import imageCompression from 'browser-image-compression';

// --- CLOUDINARY CONFIG ---
const CLOUDINARY_CLOUD_NAME = "dpusuqjvo"; 
const CLOUDINARY_UPLOAD_PRESET = "natpe_thunai_preset"; 
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// --- ONESIGNAL CONFIG (Direct REST API) ---
// ⚠️ REPLACE WITH YOUR ACTUAL KEYS
const ONESIGNAL_APP_ID = "Y65543ba1-d45e-405d-bcf9-0c4e82d73b87"; 
const ONESIGNAL_REST_KEY = "os_v2_app_mvkdxioulzaf3phzbrhifvz3q6gu7cu7btietrftnlxbsakcrkm3kq2iycnhrtc2jpxz626uoqp5cz7mfdphu6piavurzxzen6yr5ai";

// --- NOTIFICATION HELPER ---
const sendChatNotification = async (
    recipientPlayerId: string, 
    senderName: string, 
    messagePreview: string,
    data: any = {}
) => {
    if (!recipientPlayerId || !ONESIGNAL_APP_ID) return;

    try {
        await fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${ONESIGNAL_REST_KEY}`
            },
            body: JSON.stringify({
                app_id: ONESIGNAL_APP_ID,
                include_player_ids: [recipientPlayerId],
                headings: { en: `New Message from ${senderName}` },
                contents: { en: messagePreview },
                data: data,
                android_group: "chat_messages", 
                priority: 10
            })
        });
        console.log("🔔 Chat Notification sent");
    } catch (e) {
        console.error("Notification failed", e);
    }
};

// --- INTERFACES ---
interface ChatRoom extends Models.Document {
  transactionId: string;
  serviceId: string;
  buyerId: string;
  providerId: string;
  buyerUsername: string;
  providerUsername: string;
  collegeName: string; 
  status: "active" | "closed";
}

interface ChatMessage extends Models.Document {
  chatRoomId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  type?: "text" | "image" | "safety_alert" | "system";
  imageUrl?: string;
}

const ChatPage = () => {
  const { chatRoomId } = useParams<{ chatRoomId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();

  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  
  // Image Upload State
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- 1. INITIAL FETCH & REALTIME SUBSCRIPTION ---
  useEffect(() => {
    if (isAuthLoading || !user || !chatRoomId) return;

    let unsubscribe: () => void;

    const setupChat = async () => {
      setIsLoadingChat(true);
      try {
        const roomDoc = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_CHAT_ROOMS_COLLECTION_ID,
          chatRoomId
        ) as unknown as ChatRoom;

        if (roomDoc.buyerId !== user.$id && roomDoc.providerId !== user.$id) {
          toast.error("Access denied.");
          navigate("/activity"); 
          return;
        }
        setChatRoom(roomDoc);

        const messagesResponse = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_CHAT_MESSAGES_COLLECTION_ID,
          [
            Query.equal('chatRoomId', chatRoomId),
            Query.orderAsc('$createdAt'),
            Query.limit(100)
          ]
        );
        setMessages(messagesResponse.documents as unknown as ChatMessage[]);

        unsubscribe = databases.client.subscribe(
          `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_CHAT_MESSAGES_COLLECTION_ID}.documents`,
          (response) => {
            if (response.events.includes("databases.*.collections.*.documents.*.create")) {
              const payload = response.payload as unknown as ChatMessage;
              if (payload.chatRoomId === chatRoomId) {
                setMessages((prev) => {
                    if (prev.some(m => m.$id === payload.$id)) return prev;
                    return [...prev, payload];
                });
              }
            }
          }
        );

      } catch (error: any) {
        console.error("Chat Setup Error:", error);
        toast.error("Connection failed. Please refresh.");
      } finally {
        setIsLoadingChat(false);
      }
    };

    setupChat();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, chatRoomId, isAuthLoading, navigate]);

  // --- 2. AUTO-SCROLL ---
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoadingChat, previewUrl]); // Scroll when preview appears too

  // --- 3. HANDLE IMAGE SELECTION ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 5 * 1024 * 1024) { // 5MB Limit Check
              toast.error("Image too large. Max 5MB allowed.");
              return;
          }
          setSelectedImage(file);
          setPreviewUrl(URL.createObjectURL(file));
      }
  };

  const clearImageSelection = () => {
      setSelectedImage(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- 4. SEND MESSAGE (TEXT or IMAGE) ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = newMessage.trim();

    if ((!trimmedMessage && !selectedImage) || !user || !chatRoomId || !chatRoom) return;

    setIsSendingMessage(true);
    
    try {
      let finalImageUrl = "";
      let messageType = "text";

      // A. Upload Image if Selected
      if (selectedImage) {
          messageType = "image";
          
          // Compress
          const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1024, useWebWorker: true };
          const compressedFile = await imageCompression(selectedImage, options);

          // Upload to Cloudinary
          const formData = new FormData();
          formData.append("file", compressedFile);
          formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

          const uploadRes = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
          if (!uploadRes.ok) throw new Error("Image upload failed");
          
          const uploadData = await uploadRes.json();
          finalImageUrl = uploadData.secure_url;
      }

      // B. Save to Database
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CHAT_MESSAGES_COLLECTION_ID,
        ID.unique(),
        {
          chatRoomId: chatRoomId,
          senderId: user.$id,
          senderUsername: user.name,
          content: trimmedMessage || (selectedImage ? "Sent an image" : ""), // Fallback text
          type: messageType,
          imageUrl: finalImageUrl 
        }
      );

      // --- C. NOTIFICATION LOGIC (NEW) ---
      // Fire and forget - don't await to avoid blocking UI
      const recipientId = user.$id === chatRoom.buyerId ? chatRoom.providerId : chatRoom.buyerId;
      if (recipientId) {
        // Fetch Recipient Player ID
        databases.listDocuments(
            APPWRITE_DATABASE_ID,
            APPWRITE_USER_PROFILES_COLLECTION_ID,
            [Query.equal('userId', recipientId)]
        ).then((profiles) => {
            const playerId = profiles.documents[0]?.oneSignalPlayerId;
            if (playerId) {
                const notifyText = trimmedMessage || (selectedImage ? "📷 Sent an image" : "New message");
                sendChatNotification(playerId, user.name, notifyText, { chatRoomId });
            }
        }).catch(err => console.log("Push trigger failed", err));
      }

      // D. Reset State
      setNewMessage(""); 
      clearImageSelection();

    } catch (error: any) {
      console.error("Send Message Failed:", error);
      toast.error(`Failed to send: ${error.message || "Unknown error"}`);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // --- 5. REPORT USER LOGIC ---
  const handleReportUser = async (reason: string) => {
    if (!user || !chatRoom) return;
    const reportedUserId = user.$id === chatRoom.buyerId ? chatRoom.providerId : chatRoom.buyerId;
    const reportedUserName = user.$id === chatRoom.buyerId ? chatRoom.providerUsername : chatRoom.buyerUsername;

    try {
        await databases.createDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_REPORTS_COLLECTION_ID,
            ID.unique(),
            {
                reporterId: user.$id,
                reporterName: user.name,
                sellerId: reportedUserId, 
                productTitle: `Chat Report: ${reportedUserName}`, 
                reason: reason,
                message: `Reported from chat room ID: ${chatRoom.$id}. Transaction Ref: ${chatRoom.transactionId}`,
                status: "Pending",
                collegeName: chatRoom.collegeName
            }
        );
        toast.success("User reported successfully.");
    } catch (error: any) {
        toast.error("Failed to submit report.");
    } finally {
        setIsReportDialogOpen(false);
    }
  };

  if (isLoadingChat || isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-secondary-neon" />
      </div>
    );
  }

  if (!chatRoom || !user) return null;

  const isBuyer = user.$id === chatRoom.buyerId;
  const otherParticipantName = isBuyer ? chatRoom.providerUsername : chatRoom.buyerUsername;
  const otherParticipantRole = isBuyer ? "Provider" : "Student";

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* Navigation */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-secondary-neon pl-0">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        
        <Card className="bg-card text-card-foreground shadow-xl border-border h-[80vh] flex flex-col overflow-hidden">
          
          {/* --- HEADER --- */}
          <CardHeader className="p-3 border-b border-border/50 bg-secondary/5 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-secondary-neon/20 flex items-center justify-center text-secondary-neon font-bold text-lg">
                  {otherParticipantName.charAt(0).toUpperCase()}
                </div>
                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-card-foreground flex items-center gap-1">
                  {otherParticipantName}
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                </CardTitle>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  {otherParticipantRole} • {chatRoom.collegeName || "Campus Peer"}
                </p>
              </div>
            </div>

            {/* Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Safety Tools</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => setIsReportDialogOpen(true)}>
                  <AlertTriangle className="mr-2 h-4 w-4" /> Report User
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => toast.info("Contact help@natpethunai.com")}>
                  <Info className="mr-2 h-4 w-4" /> Help Center
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
            
            {/* Messages Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
              
              <div className="mx-auto max-w-[95%] bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg p-3 text-center">
                <p className="text-xs text-blue-800 dark:text-blue-300 font-medium flex items-center justify-center gap-1.5 mb-1">
                  <ShieldCheck className="h-3 w-3" /> Safe Exchange Zone
                </p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-tight">
                  Meet in public campus areas (Canteen, Library). Keep conversations here for your safety.
                </p>
              </div>

              {messages.length === 0 ? (
                <div className="h-20 flex flex-col items-center justify-center text-muted-foreground opacity-50 mt-4">
                    <div className="bg-muted p-4 rounded-full mb-2">
                        <ImageIcon className="h-6 w-6" />
                    </div>
                    <p className="text-xs">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user.$id;
                  return (
                    <div key={msg.$id} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2", isMe ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[75%] px-3 py-2 rounded-2xl text-sm shadow-sm relative group break-words",
                        isMe 
                          ? "bg-secondary-neon text-primary-foreground rounded-br-sm" 
                          : "bg-muted text-foreground rounded-bl-sm"
                      )}>
                        {!isMe && <p className="text-[9px] font-bold opacity-70 mb-0.5 text-secondary-neon">{msg.senderUsername}</p>}
                        
                        {/* IMAGE RENDERING */}
                        {msg.type === 'image' && msg.imageUrl && (
                            <div className="mb-2 rounded-lg overflow-hidden border border-white/20">
                                <a href={msg.imageUrl} target="_blank" rel="noopener noreferrer">
                                    <img src={msg.imageUrl} alt="Shared content" className="max-w-full h-auto object-cover" />
                                </a>
                            </div>
                        )}

                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        
                        <p className="text-[9px] text-right mt-1 opacity-60">
                          {new Date(msg.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Input Area */}
            <div className="p-3 bg-card border-t border-border">
                {/* PREVIEW AREA */}
                {previewUrl && (
                    <div className="mb-2 relative inline-block">
                        <img src={previewUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-border" />
                        <button 
                            onClick={clearImageSelection}
                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5 shadow-md hover:scale-110 transition-transform"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                    {/* HIDDEN FILE INPUT */}
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    
                    {/* + BUTTON */}
                    <Button 
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-secondary-neon h-11 w-11 shrink-0 rounded-full bg-muted/30"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSendingMessage}
                    >
                        <Plus className="h-6 w-6" />
                    </Button>

                    <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-grow bg-input text-foreground border-border focus:ring-secondary-neon transition-all min-h-[44px] rounded-2xl"
                        disabled={isSendingMessage}
                    />
                    
                    <Button 
                        type="submit" 
                        size="icon" 
                        className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 shadow-md h-11 w-11 shrink-0 rounded-full" 
                        disabled={isSendingMessage || (!newMessage.trim() && !selectedImage)}
                    >
                        {isSendingMessage ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
                    </Button>
                </form>
            </div>
          </CardContent>
        </Card>

        {/* Report Dialog */}
        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Report User
              </DialogTitle>
              <DialogDescription>
                Is this user behaving suspiciously? This report will be sent to the developer dashboard immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2 space-y-2">
                <p className="text-sm font-medium">Select Reason:</p>
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleReportUser("Rude / Abusive")} className="text-xs">Rude / Abusive</Button>
                    <Button variant="outline" size="sm" onClick={() => handleReportUser("Scam / Fraud")} className="text-xs">Scam / Fraud</Button>
                    <Button variant="outline" size="sm" onClick={() => handleReportUser("Safety Threat")} className="text-xs">Safety Threat</Button>
                    <Button variant="outline" size="sm" onClick={() => handleReportUser("Other Suspicious Behavior")} className="text-xs">Other</Button>
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsReportDialogOpen(false)}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ChatPage;