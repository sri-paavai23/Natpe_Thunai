"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, NotebookPen, Bike, PlusCircle, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostErrandForm from "@/components/forms/PostErrandForm";
import { useErrandListings, ErrandPost } from "@/hooks/useErrandListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_ERRANDS_COLLECTION_ID,APPWRITE_SERVICE_REVIEWS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import * as z from "zod";
import DeletionInfoMessage from "@/components/DeletionInfoMessage";
import { Alert, AlertDescription } from "@/components/ui/alert"; // NEW: Import Alert components

// Errand types specific to this page
const ERRAND_TYPES = ["note-writing", "small-job", "delivery"];

const STANDARD_ERRAND_OPTIONS = [
  { value: "note-writing", label: "Note-writing/Transcription" },
  { value: "small-job", label: "Small Job (e.g., moving books)" },
  { value: "delivery", label: "Delivery Services (within campus)" },
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


const ErrandsPage = () => {
  const { user, userProfile } = useAuth();
  const [isPostErrandDialogOpen, setIsPostErrandDialogOpen] = useState(false);
  const [preselectedErrandType, setPreselectedErrandType] = useState<string | undefined>(undefined);
  const [showErrandFormInfoAlert, setShowErrandFormInfoAlert] = useState(true); // NEW: State for dismissible alert
  
  // Fetch only standard errands for the user's college
  const { errands: postedErrands, isLoading, error } = useErrandListings(ERRAND_TYPES);

  // Content is age-gated if user is 25 or older
  const isAgeGated = (userProfile?.age ?? 0) >= 25; 

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleErrandClick = (errandType: string) => {
    setPreselectedErrandType(errandType);
    setIsPostErrandDialogOpen(true); // Open the dialog
    setShowErrandFormInfoAlert(true); // Reset alert visibility when dialog opens
  };

  const handlePostErrand = async (data: z.infer<typeof ErrandFormSchema>) => { // Correctly type data
    if (!user || !userProfile) {
      toast.error("You must be logged in to post an errand.");
      return;
    }

    try {
      const newErrandData = {
        ...data,
        // If type is 'other' and otherTypeDescription is empty, use otherTypeDescription as the actual type
        type: data.type === 'other' && data.otherTypeDescription 
              ? data.otherTypeDescription 
              : data.type,
        deadline: data.deadline ? data.deadline.toISOString() : null, // Convert Date to ISO string
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName, // Ensure collegeName is explicitly added
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_ERRANDS_COLLECTION_ID,
        ID.unique(),
        newErrandData
      );
      
      toast.success(`Your errand "${data.title}" has been posted!`);
      setIsPostErrandDialogOpen(false);
      setPreselectedErrandType(undefined); // Clear preselected type after posting
    } catch (e: any) {
      console.error("Error posting errand:", e);
      toast.error(e.message || "Failed to post errand listing.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Errands</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-secondary-neon" /> Campus Errands
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Need a helping hand with small tasks? Post your errand here for your college peers!
            </p>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleErrandClick("note-writing")}
            >
              <NotebookPen className="mr-2 h-4 w-4" /> Note-writing/Transcription
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleErrandClick("small-job")}
            >
              <Bike className="mr-2 h-4 w-4" /> Small Jobs (e.g., moving books)
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleErrandClick("delivery")}
            >
              <Bike className="mr-2 h-4 w-4" /> Delivery Services (within campus)
            </Button>
            <Dialog open={isPostErrandDialogOpen} onOpenChange={setIsPostErrandDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4" disabled={isAgeGated}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Post Your Errand
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader className="relative">
                  <DialogTitle className="text-foreground">Post New Campus Errand</DialogTitle>
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
                {/* NEW: Scroll pane for dialog content */}
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2"> {/* Adjust height as needed */}
                  {showErrandFormInfoAlert && ( // NEW: Conditionally render dismissible alert
                    <Alert className="bg-blue-50 border-blue-200 text-blue-800 flex items-center justify-between mb-4">
                      <AlertDescription>
                        Fill out the details to post your errand for college peers.
                      </AlertDescription>
                      <Button variant="ghost" size="icon" onClick={() => setShowErrandFormInfoAlert(false)} className="text-blue-800 hover:bg-blue-100">
                        <X className="h-4 w-4" />
                      </Button>
                    </Alert>
                  )}
                  <DeletionInfoMessage />
                  <PostErrandForm 
                    onSubmit={handlePostErrand} 
                    onCancel={() => {
                      setIsPostErrandDialogOpen(false);
                      setPreselectedErrandType(undefined);
                    }} 
                    typeOptions={STANDARD_ERRAND_OPTIONS}
                    initialType={preselectedErrandType}
                  />
                </div> {/* END: Scroll pane */}
              </DialogContent>
            </Dialog>
            {isAgeGated && (
              <p className="text-xs text-destructive-foreground mt-4">
                Note: Posting errands is disabled for users 25 or older.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Recently Posted Errands</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading errands...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading errands: {error}</p>
            ) : postedErrands.length > 0 ? (
              postedErrands.map((errand) => (
                <div key={errand.$id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground">{errand.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{errand.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Type: <span className="font-medium text-foreground">{errand.type}</span></p>
                  <p className="text-xs text-muted-foreground">Compensation: <span className="font-medium text-foreground">{errand.compensation}</span></p>
                  {errand.deadline && <p className="text-xs text-muted-foreground">Deadline: <span className="font-medium text-foreground">{new Date(errand.deadline).toLocaleDateString()}</span></p>}
                  <p className="text-xs text-muted-foreground">Contact: <span className="font-medium text-foreground">{errand.contact}</span></p>
                  <p className="text-xs text-muted-foreground">Posted: {new Date(errand.$createdAt).toLocaleDateString()}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No errands posted yet for your college. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ErrandsPage;