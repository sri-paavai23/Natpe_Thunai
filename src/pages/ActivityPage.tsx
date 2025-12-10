"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Frown, Smile, Search, MessageSquareText } from "lucide-react"; // Added Smile icon
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostLostFoundForm, { LostFoundPostData } from "@/components/forms/PostLostFoundForm";
import { useLostFoundListings, LostFoundPost } from "@/hooks/useLostFoundListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_LOST_FOUND_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

const ActivityPage = () => {
  const { user, userProfile } = useAuth();
  const [isPostLostFoundDialogOpen, setIsPostLostFoundDialogOpen] = useState(false);
  const [initialLostFoundType, setInitialLostFoundType] = useState<"lost" | "found" | undefined>(undefined); // NEW state for initial type
  
  const { listings: lostFoundListings, isLoading, error } = useLostFoundListings();

  // Filter out resolved items that are older than 24 hours
  const filteredListings = lostFoundListings.filter(item => {
    if (item.status === 'resolved') {
      const resolvedDate = new Date(item.$updatedAt); // Assuming $updatedAt reflects resolution time
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return resolvedDate > twentyFourHoursAgo; // Keep if resolved within last 24 hours
    }
    return true; // Keep unresolved items
  });

  // NEW: Function to open dialog with pre-filled type
  const handleOpenPostLostFoundDialog = (type?: "lost" | "found") => {
    setInitialLostFoundType(type);
    setIsPostLostFoundDialogOpen(true);
  };

  const handlePostLostFound = async (data: LostFoundPostData) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a lost/found item.");
      return;
    }

    try {
      const newLostFoundData = {
        ...data,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName,
        status: "active", // Default status
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_LOST_FOUND_COLLECTION_ID,
        ID.unique(),
        newLostFoundData
      );
      
      toast.success(`Your ${data.type} item "${data.title}" has been posted!`);
      setIsPostLostFoundDialogOpen(false);
      setInitialLostFoundType(undefined); // Reset initial type
    } catch (e: any) {
      console.error("Error posting lost/found item:", e);
      toast.error(e.message || "Failed to post lost/found item.");
    }
  };

  const handleResolveItem = async (item: LostFoundPost) => {
    if (!user || item.posterId !== user.$id) {
      toast.error("You can only resolve your own lost/found items.");
      return;
    }
    if (item.status === 'resolved') {
      toast.info("This item is already marked as resolved.");
      return;
    }

    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_LOST_FOUND_COLLECTION_ID,
        item.$id,
        { status: "resolved" }
      );
      toast.success(`Item "${item.title}" marked as resolved! It will disappear in 24 hours.`);
    } catch (e: any) {
      console.error("Error resolving item:", e);
      toast.error(e.message || "Failed to resolve item.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Campus Activity</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Search className="h-5 w-5 text-secondary-neon" /> Lost & Found
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Help your peers find lost items or report something you've found!
            </p>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleOpenPostLostFoundDialog("lost")} // Prefill
            >
              <Frown className="mr-2 h-4 w-4" /> Post Lost Item
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleOpenPostLostFoundDialog("found")} // Prefill
            >
              <Smile className="mr-2 h-4 w-4" /> Post Found Item
            </Button>
            <Dialog open={isPostLostFoundDialogOpen} onOpenChange={setIsPostLostFoundDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4" onClick={() => handleOpenPostLostFoundDialog()}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Post New Lost/Found
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Lost/Found Item</DialogTitle>
                </DialogHeader>
                <PostLostFoundForm 
                  onSubmit={handlePostLostFound} 
                  onCancel={() => { setIsPostLostFoundDialogOpen(false); setInitialLostFoundType(undefined); }} 
                  initialType={initialLostFoundType} // Pass initial type
                />
              </DialogContent>
            </Dialog>
            <p className="text-xs text-muted-foreground mt-4">
              Note: Lost & Found is a non-commissioned service. Your contributions help build a trustworthy community.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Recent Lost & Found</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading listings...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading listings: {error}</p>
            ) : filteredListings.length > 0 ? (
              filteredListings.map((item) => (
                <div key={item.$id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    {item.title}
                    {item.status === 'resolved' ? (
                      <Smile className="h-5 w-5 text-green-500" /> // Green happy emoji for resolved
                    ) : (
                      <Frown className="h-5 w-5 text-red-500" /> // Red sad emoji for active
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Type: <span className="font-medium text-foreground">{item.type}</span></p>
                  <p className="text-xs text-muted-foreground">Location: <span className="font-medium text-foreground">{item.location}</span></p>
                  <p className="text-xs text-muted-foreground">Contact: <span className="font-medium text-foreground">{item.contact}</span></p>
                  <p className="text-xs text-muted-foreground">Posted: {new Date(item.$createdAt).toLocaleDateString()}</p>
                  {item.status === 'active' && user?.$id === item.posterId && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 w-full border-green-500 text-green-500 hover:bg-green-500/10"
                      onClick={() => handleResolveItem(item)}
                    >
                      <MessageSquareText className="mr-2 h-4 w-4" /> Mark as Resolved
                    </Button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No lost or found items posted yet for your college. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ActivityPage;