"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Zap, PlusCircle, Loader2, X, Package, Handshake, ShoppingCart } from "lucide-react"; // Added new icons
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostErrandForm from "@/components/forms/PostErrandForm";
import { useErrandListings, ErrandPost } from "@/hooks/useErrandListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_ERRANDS_COLLECTION_ID,
APPWRITE_SERVICE_REVIEWS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import * as z from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
// import DeletionInfoMessage from "@/components/DeletionInfoMessage"; // REMOVED: Duplicate instance

// Need types specific to this page (Products, Services, Errands, Other)
const NEED_TYPES = ["product-need", "service-need", "errand-need", "other"];

const NEED_OPTIONS = [
  { value: "product-need", label: "Product Need" },
  { value: "service-need", label: "Service Need" },
  { value: "errand-need", label: "Errand Need" },
  { value: "other", label: "Other Need" },
];

// Define the Zod schema for the PostErrandForm data (copied from PostErrandForm.tsx)
const ErrandFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  type: z.string().min(1, { message: "Please select a need type." }),
  otherTypeDescription: z.string().optional(), // For 'other' type
  compensation: z.string().min(2, { message: "Compensation details are required." }),
  deadline: z.date().optional(),
  contact: z.string().min(5, { message: "Contact information is required." }),
});

const ShortTermNeedsPage = () => { // Renamed to PostANeedPage in summary, but keeping file name for now
  const { user, userProfile } = useAuth();
  const [isPostErrandDialogOpen, setIsPostErrandDialogOpen] = useState(false);
  const [initialTypeForForm, setInitialTypeForForm] = useState<string | undefined>(undefined);
  const [showNeedFormInfoAlert, setShowNeedFormInfoAlert] = useState(true); // Renamed state for dismissible alert
  
  // Fetch only needs for the user's college
  const { errands: postedNeeds, isLoading, error } = useErrandListings(NEED_TYPES); // Changed variable name

  // Content is age-gated if user is 25 or older
  const isAgeGated = (userProfile?.age ?? 0) >= 25; 

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleNeedClick = (needType: string) => {
    setInitialTypeForForm(needType);
    setIsPostErrandDialogOpen(true);
    setShowNeedFormInfoAlert(true); // Reset alert visibility when dialog opens
  };

  const handlePostErrand = async (data: z.infer<typeof ErrandFormSchema>) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a need.");
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
      
      toast.success(`Your need "${data.title}" has been posted!`);
      setIsPostErrandDialogOpen(false);
      setInitialTypeForForm(undefined); // Reset initial type
    } catch (e: any) {
      console.error("Error posting need:", e);
      toast.error(e.message || "Failed to post need listing.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Post a Need</h1> {/* Changed page title */}
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-secondary-neon" /> Post a Need
            </CardTitle> {/* Changed card title */}
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Request products, services, errands, or any other help you need from your college peers!
            </p> {/* Changed card description */}
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleNeedClick("product-need")}
            >
              <Package className="mr-2 h-4 w-4" /> Post a Product Need
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleNeedClick("service-need")}
            >
              <Handshake className="mr-2 h-4 w-4" /> Post a Service Need
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleNeedClick("errand-need")}
            >
              <ShoppingCart className="mr-2 h-4 w-4" /> Post an Errand Need
            </Button>
            <Dialog open={isPostErrandDialogOpen} onOpenChange={setIsPostErrandDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4" disabled={isAgeGated}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Post Any Other Need
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader className="relative">
                  <DialogTitle className="text-foreground">Post New Need</DialogTitle> {/* Changed dialog title */}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:bg-muted"
                    onClick={() => setIsPostErrandDialogOpen(false)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </DialogHeader>
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                  {showNeedFormInfoAlert && ( // Using the renamed state
                    <Alert className="bg-blue-50 border-blue-200 text-blue-800 flex items-center justify-between mb-4">
                      <AlertDescription>
                        Fill out the details to post your need for college peers.
                      </AlertDescription> {/* Changed alert description */}
                      <Button variant="ghost" size="icon" onClick={() => setShowNeedFormInfoAlert(false)} className="text-blue-800 hover:bg-blue-100">
                        <X className="h-4 w-4" />
                      </Button>
                    </Alert>
                  )}
                  {/* <DeletionInfoMessage /> REMOVED: Duplicate instance */}
                  <PostErrandForm 
                    onSubmit={handlePostErrand} 
                    onCancel={() => { setIsPostErrandDialogOpen(false); setInitialTypeForForm(undefined); }}
                    typeOptions={NEED_OPTIONS} // Using the new options
                    initialType={initialTypeForForm}
                  />
                </div>
              </DialogContent>
            </Dialog>
            <p className="text-xs text-destructive-foreground mt-4">
              Note: This section is age-gated for users under 25.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Recently Posted Needs</CardTitle> {/* Changed card title */}
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading needs...</p> {/* Changed loading text */}
              </div>
            ) : ( // Explicitly close isLoading's true branch, start its false branch
              error ? (
                <p className="text-center text-destructive py-4">Error loading requests: {error}</p>
              ) : ( // Explicitly close error's true branch, start its false branch
                postedNeeds.length > 0 ? (
                  postedNeeds.map((request) => (
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
                ) : ( // Explicitly close postedNeeds.length > 0's true branch, start its false branch
                  <p className="text-center text-muted-foreground py-4">No needs posted yet for your college. Be the first!</p>
                )
              )
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ShortTermNeedsPage;