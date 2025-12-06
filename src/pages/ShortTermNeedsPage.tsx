"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Zap, PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostErrandForm from "@/components/forms/PostErrandForm";
import { useErrandListings, ErrandPost } from "@/hooks/useErrandListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_ERRANDS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";

// Errand types specific to this page (Urgent/Short-Term)
const URGENT_TYPES = ["instant-help", "emergency-delivery"];

const URGENT_ERRAND_OPTIONS = [
  { value: "instant-help", label: "Instant Help" },
  { value: "emergency-delivery", label: "Emergency Deliveries" },
  { value: "other", label: "Other" },
];

const ShortTermNeedsPage = () => {
  const { user, userProfile } = useAuth();
  const [isPostErrandDialogOpen, setIsPostErrandDialogOpen] = useState(false);
  
  // Fetch only urgent requests
  const { errands: postedUrgentRequests, isLoading, error } = useErrandListings(URGENT_TYPES);

  // Content is age-gated if user is 25 or older
  const isAgeGated = (userProfile?.age ?? 0) >= 25; 

  const handleNeedClick = (needType: string) => {
    toast.info(`You selected "${needType}". Post your urgent request using the button below.`);
  };

  const handlePostErrand = async (data: Omit<ErrandPost, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "posterId" | "posterName">) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post an urgent request.");
      return;
    }

    try {
      const newRequestData = {
        ...data,
        posterId: user.$id,
        posterName: user.name,
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_ERRANDS_COLLECTION_ID,
        ID.unique(),
        newRequestData
      );
      
      toast.success(`Your urgent request "${data.title}" has been posted!`);
      setIsPostErrandDialogOpen(false);
    } catch (e: any) {
      console.error("Error posting urgent request:", e);
      toast.error(e.message || "Failed to post urgent request listing.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Short-Term Needs</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-secondary-neon" /> Urgent Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              For urgent tasks with extra charges. Get help when you need it most!
            </p>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleNeedClick("Instant Help")}
            >
              <Zap className="mr-2 h-4 w-4" /> Instant Help
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleNeedClick("Emergency Deliveries")}
            >
              <Zap className="mr-2 h-4 w-4" /> Emergency Deliveries
            </Button>
            <Dialog open={isPostErrandDialogOpen} onOpenChange={setIsPostErrandDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4" disabled={isAgeGated}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Post Urgent Request
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Urgent Request</DialogTitle>
                </DialogHeader>
                <PostErrandForm 
                  onSubmit={handlePostErrand} 
                  onCancel={() => setIsPostErrandDialogOpen(false)} 
                  categoryOptions={URGENT_ERRAND_OPTIONS}
                />
              </DialogContent>
            </Dialog>
            <p className="text-xs text-destructive-foreground mt-4">
              Note: This section is age-gated for users under 25.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Recently Posted Urgent Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading urgent requests...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading requests: {error}</p>
            ) : postedUrgentRequests.length > 0 ? (
              postedUrgentRequests.map((request) => (
                <div key={request.$id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground">{request.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Type: <span className="font-medium text-foreground">{request.type}</span></p>
                  <p className="text-xs text-muted-foreground">Compensation: <span className="font-medium text-foreground">{request.compensation}</span></p>
                  {request.deadline && <p className="text-xs text-muted-foreground">Deadline: <span className="font-medium text-foreground">{request.deadline}</span></p>}
                  <p className="text-xs text-muted-foreground">Contact: <span className="font-medium text-foreground">{request.contact}</span></p>
                  <p className="text-xs text-muted-foreground">Posted: {new Date(request.$createdAt).toLocaleDateString()}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No urgent requests posted yet. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ShortTermNeedsPage;