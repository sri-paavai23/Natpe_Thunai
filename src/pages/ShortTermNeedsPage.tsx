"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Zap, PlusCircle, Loader2, X } from "lucide-react"; // Added X icon
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostErrandForm from "@/components/forms/PostErrandForm";
import { useErrandListings, ErrandPost } from "@/hooks/useErrandListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_ERRANDS_COLLECTION_ID,
APPWRITE_SERVICE_REVIEWS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import * as z from "zod";

// Errand types specific to this page (Urgent/Short-Term)
const URGENT_TYPES = ["instant-help", "emergency-delivery", "other"]; // Include 'other' for filtering

const URGENT_ERRAND_OPTIONS = [
  { value: "instant-help", label: "Instant Help" },
  { value: "emergency-delivery", label: "Emergency Deliveries" },
  { value: "other", label: "Other" },
];

// Define the Zod schema for the PostErrandForm data (copied from PostErrandForm.tsx)
const ErrandFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  type: z.string().min(1, { message: "Please select an errand type." }),
  otherTypeDescription: z.string().optional(), // For 'other' type
  compensation: z.string().min(2, { message: "Compensation details are required." }),
  deadline: z.date().optional(),
  contact: z.string().min(5, { message: "Contact information is required." }),
});

const ShortTermNeedsPage = () => {
  const { user, userProfile } = useAuth();
  const [isPostErrandDialogOpen, setIsPostErrandDialogOpen] = useState(false);
  const [initialTypeForForm, setInitialTypeForForm] = useState<string | undefined>(undefined); // Changed from initialCategoryForForm
  
  // Fetch only urgent requests for the user's college
  const { errands: postedUrgentRequests, isLoading, error } = useErrandListings(URGENT_TYPES);

  // Content is age-gated if user is 25 or older
  const isAgeGated = (userProfile?.age ?? 0) >= 25; 

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleNeedClick = (needType: string) => {
    setInitialTypeForForm(needType); // Changed from setInitialCategoryForForm
    setIsPostErrandDialogOpen(true);
  };

  const handlePostErrand = async (data: z.infer<typeof ErrandFormSchema>) => { // Correctly type data
    if (!user || !userProfile) {
      toast.error("You must be logged in to post an urgent request.");
      return;
    }

    try {
      const newRequestData = {
        ...data,
        // If type is 'other', use otherTypeDescription as the actual type
        type: data.type === 'other' && data.otherTypeDescription 
                  ? data.otherTypeDescription 
                  : data.type,
        deadline: data.deadline ? data.deadline.toISOString() : null, // Convert Date to ISO string
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName,
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_ERRANDS_COLLECTION_ID,
        ID.unique(),
        newRequestData
      );
      
      toast.success(`Your urgent request "${data.title}" has been posted!`);
      setIsPostErrandDialogOpen(false);
      setInitialTypeForForm(undefined); // Reset initial type
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
              For urgent tasks with extra charges. Get help when you need it most from your college peers!
            </p>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleNeedClick("instant-help")}
            >
              <Zap className="mr-2 h-4 w-4" /> Instant Help
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleNeedClick("emergency-delivery")}
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
                <DialogHeader className="relative"> {/* Added relative for close button positioning */}
                  <DialogTitle className="text-foreground">Post New Urgent Request</DialogTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:bg-muted"
                    onClick={() => setIsPostErrandDialogOpen(false)} // Dismiss the dialog
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </DialogHeader>
                <PostErrandForm 
                  onSubmit={handlePostErrand} 
                  onCancel={() => { setIsPostErrandDialogOpen(false); setInitialTypeForForm(undefined); }} // Changed to setInitialTypeForForm
                  typeOptions={URGENT_ERRAND_OPTIONS} // Changed to typeOptions
                  initialType={initialTypeForForm} // Changed to initialType
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
                  {request.deadline && <p className="text-xs text-muted-foreground">Deadline: <span className="font-medium text-foreground">{new Date(request.deadline).toLocaleDateString()}</span></p>}
                  <p className="text-xs text-muted-foreground">Contact: <span className="font-medium text-foreground">{request.contact}</span></p>
                  <p className="text-xs text-muted-foreground">Posted: {new Date(request.$createdAt).toLocaleDateString()}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No urgent requests posted yet for your college. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ShortTermNeedsPage;