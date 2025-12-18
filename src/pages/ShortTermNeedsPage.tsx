"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostErrandForm from "@/components/forms/PostErrandForm"; // Assuming this component exists
import { useErrandListings, ErrandPost } from "@/hooks/useErrandListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_ERRANDS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SHORT_TERM_NEED_CATEGORIES = ["delivery", "academic", "personal", "other"];

const SHORT_TERM_NEED_FORM_OPTIONS = [
  { value: "delivery", label: "Delivery" },
  { value: "academic", label: "Academic Help" },
  { value: "personal", label: "Personal Task" },
  { value: "other", label: "Other" },
];

const ShortTermNeedsPage = () => {
  const { user, userProfile } = useAuth();
  const [isPostRequestDialogOpen, setIsPostRequestDialogOpen] = useState(false);
  
  const { errands: postedRequests, isLoading, error } = useErrandListings(SHORT_TERM_NEED_CATEGORIES);

  const isAgeGated = (userProfile?.age ?? 0) >= 25; 

  const handlePostRequest = async (data: Omit<ErrandPost, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "posterId" | "posterName" | "collegeName" | "status">) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a request.");
      return;
    }

    try {
      const newRequestData = {
        ...data,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName,
        status: "open", // Default status
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_ERRANDS_COLLECTION_ID,
        ID.unique(),
        newRequestData
      );
      
      toast.success(`Your request "${data.title}" has been posted!`);
      setIsPostRequestDialogOpen(false);
    } catch (e: any) {
      console.error("Error posting request:", e);
      toast.error(e.message || "Failed to post request.");
    }
  };

  const getStatusBadgeClass = (status: ErrandPost["status"]) => {
    switch (status) {
      case "open":
        return "bg-green-500 text-white";
      case "assigned":
        return "bg-blue-500 text-white";
      case "completed":
        return "bg-gray-500 text-white";
      case "cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Short-Term Needs</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-secondary-neon" /> Post a New Request
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Need something done quickly? Post a short-term request and get help from peers.
            </p>
            <Dialog open={isPostRequestDialogOpen} onOpenChange={setIsPostRequestDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4" disabled={isAgeGated}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Post Request
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Short-Term Need</DialogTitle>
                </DialogHeader>
                <PostErrandForm 
                  onSubmit={handlePostRequest} 
                  onCancel={() => setIsPostRequestDialogOpen(false)} 
                  categoryOptions={SHORT_TERM_NEED_FORM_OPTIONS}
                  titlePlaceholder="e.g., Help moving boxes, Need notes for class"
                  descriptionPlaceholder="Provide details about your request, urgency, etc."
                  compensationPlaceholder="e.g., ₹50, A favor, Negotiable"
                  deadlinePlaceholder="e.g., This evening, Before exam"
                  contactPlaceholder="e.g., WhatsApp, Room number"
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
            <CardTitle className="text-xl font-semibold text-card-foreground">Available Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading requests...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading requests: {error}</p>
            ) : postedRequests.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {postedRequests.map((request) => (
                  <div key={request.$id} className="p-3 border border-border rounded-md bg-background">
                    <h3 className="font-semibold text-foreground">{request.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Type: <span className="font-medium text-foreground">{request.type}</span></p>
                    <p className="text-xs text-muted-foreground">Compensation: <span className="font-medium text-foreground">{request.compensation}</span></p>
                    {request.deadline && <p className="text-xs text-muted-foreground">Deadline: <span className="font-medium text-foreground">{request.deadline}</span></p>}
                    <p className="text-xs text-muted-foreground">Contact: <span className="font-medium text-foreground">{request.contact}</span></p>
                    <p className="text-xs text-muted-foreground">Posted by: {request.posterName}</p>
                    <div className="flex justify-between items-center mt-2">
                      <Badge className={cn("px-2 py-1 text-xs font-semibold", getStatusBadgeClass(request.status))}>
                        {request.status}
                      </Badge>
                      <Button variant="secondary" size="sm" className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No short-term needs posted yet for your college. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ShortTermNeedsPage;