"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Briefcase, Loader2, DollarSign, MapPin, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ErrandForm from "@/components/forms/ErrandForm";
import { useErrandListings, ErrandPost } from "@/hooks/useErrandListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_ERRANDS_COLLECTION_ID } from "@/lib/appwrite"; // Fixed: Corrected import
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ErrandsPage = () => {
  const { user, userProfile, isLoading: authLoading } = useAuth();
  const { errands, isLoading: errandsLoading, error } = useErrandListings();
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);

  // Content is age-gated if user is 25 or older
  const isAgeGated = (userProfile?.age ?? 0) >= 25; // Fixed: Use existing age or default

  const handleFormSuccess = () => {
    setIsFormDialogOpen(false);
    toast.success("Errand posted successfully!");
  };

  const handleFormCancel = () => {
    setIsFormDialogOpen(false);
  };

  const handleAcceptErrand = async (errand: ErrandPost) => {
    if (!user) {
      toast.error("You must be logged in to accept an errand.");
      return;
    }
    if (errand.posterId === user.$id) {
      toast.error("You cannot accept your own errand.");
      return;
    }
    if (errand.status !== "Open") {
      toast.error("This errand is no longer open.");
      return;
    }

    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_ERRANDS_COLLECTION_ID,
        errand.$id,
        {
          status: "Accepted",
          acceptedById: user.$id,
          acceptedByName: user.name,
        }
      );
      toast.success(`You have accepted the errand: "${errand.title}"!`);
    } catch (error: any) {
      console.error("Error accepting errand:", error);
      toast.error(error.message || "Failed to accept errand.");
    }
  };

  const renderContent = () => {
    if (authLoading || errandsLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-secondary-neon" />
          <p className="ml-3 text-muted-foreground">Loading errands...</p>
        </div>
      );
    }

    if (error) {
      return <p className="text-center text-destructive py-4">Error: {error}</p>;
    }

    if (isAgeGated) {
      return (
        <Card className="bg-destructive/10 border-destructive text-destructive-foreground shadow-lg">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-destructive flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-destructive" /> Restricted Access
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-gray-800">
              This section is restricted for users aged 25 and above.
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Please contact support if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (errands.length === 0) {
      return <p className="text-center text-muted-foreground py-4">No errands posted yet. Be the first to post one!</p>;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {errands.map((errand) => (
          <Card key={errand.$id} className="bg-card border-border p-4 shadow-md">
            <CardHeader className="p-0 pb-2">
              <CardTitle className="text-lg font-semibold text-foreground">{errand.title}</CardTitle>
              <Badge className={cn(
                "mt-1",
                errand.status === "Open" && "bg-green-500",
                errand.status === "Accepted" && "bg-orange-500",
                errand.status === "Completed" && "bg-blue-500"
              )}>{errand.status}</Badge>
            </CardHeader>
            <CardContent className="p-0 space-y-2 text-sm text-muted-foreground">
              <p>{errand.description}</p>
              <p className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-secondary-neon" /> Reward: ₹{errand.reward.toFixed(2)}</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-secondary-neon" /> Location: {errand.location}</p>
              <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-secondary-neon" /> Deadline: {new Date(errand.deadline).toLocaleDateString()}</p>
              <p className="text-xs">Posted by: {errand.posterName}</p>
              {errand.status === "Accepted" && errand.acceptedByName && (
                <p className="text-xs text-blue-600">Accepted by: {errand.acceptedByName}</p>
              )}
              {errand.status === "Open" && user?.$id !== errand.posterId && (
                <Button
                  className="w-full mt-4 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
                  onClick={() => handleAcceptErrand(errand)}
                >
                  Accept Errand
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Campus Errands</h1>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-secondary-neon" /> Post or Find Errands
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Need help with a task or looking to earn some quick cash? Post or find errands here!
            </p>
            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" disabled={isAgeGated}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Post New Errand
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Create New Errand</DialogTitle>
                </DialogHeader>
                <ErrandForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {renderContent()}
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ErrandsPage;