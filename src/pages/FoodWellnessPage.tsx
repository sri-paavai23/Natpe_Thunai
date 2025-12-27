"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Soup, HeartPulse, ShieldCheck, PlusCircle, Utensils, Loader2, MessageSquareText, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostServiceForm from "@/components/forms/PostServiceForm";
import { useServiceListings, ServicePost } from "@/hooks/useServiceListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID,APPWRITE_SERVICE_REVIEWS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import FoodOfferingCard from "@/components/FoodOfferingCard";
import FoodCustomRequestsList from "@/components/FoodCustomRequestsList";
import DeletionInfoMessage from "@/components/DeletionInfoMessage";
import { Alert, AlertDescription } from "@/components/ui/alert"; // NEW: Import Alert components

// Service categories specific to this page
const OFFERING_CATEGORIES = ["homemade-meals", "wellness-remedies"];

// Define category options for Offerings
const OFFERING_OPTIONS = [
  { value: "homemade-meals", label: "Food" },
  { value: "wellness-remedies", label: "Remedy" },
  { value: "other", label: "Other" },
];

// Define category options for Custom Requests
const CUSTOM_REQUEST_OPTIONS = [
  { value: "homemade-meals", label: "Custom Food" },
  { value: "wellness-remedies", label: "Custom Remedy" },
  { value: "other", label: "Other" },
];


const FoodWellnessPage = () => {
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth();
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);
  const [isPostCustomOrderDialogOpen, setIsPostCustomOrderDialogOpen] = useState(false);
  const [showOfferingFormInfoAlert, setShowOfferingFormInfoAlert] = useState(true); // NEW: State for dismissible alert
  const [showCustomOrderFormInfoAlert, setShowCustomOrderFormInfoAlert] = useState(true); // NEW: State for dismissible alert
  
  // Fetch all food/wellness related posts for the user's college
  const { services: allPosts, isLoading, error } = useServiceListings(undefined); 

  const postedOfferings = allPosts.filter(p => !p.isCustomOrder && OFFERING_CATEGORIES.includes(p.category));
  const postedCustomRequests = allPosts.filter(p => p.isCustomOrder);

  const handlePostService = async (data: {
    title: string;
    description: string;
    category: string;
    price: string;
    contact: string;
    customOrderDescription?: string;
    ambassadorDelivery: boolean;
    ambassadorMessage: string;
  }) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post.");
      return;
    }

    try {
      const newPostData = {
        ...data,
        posterId: user.$id,
        posterName: user.name,
        isCustomOrder: false,
        collegeName: userProfile.collegeName,
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        ID.unique(),
        newPostData
      );
      
      toast.success(`Your offering "${data.title}" has been posted!`);
      setIsPostServiceDialogOpen(false);
    } catch (e: any) {
      console.error("Error posting service:", e);
      toast.error(e.message || "Failed to post offering.");
    }
  };

  const handlePostCustomOrder = async (data: {
    title: string;
    description: string;
    category: string;
    price: string;
    contact: string;
    customOrderDescription?: string;
    ambassadorDelivery: boolean;
    ambassadorMessage: string;
  }) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a custom request.");
      return;
    }

    try {
      const newRequest = {
        ...data,
        posterId: user.$id,
        posterName: user.name,
        isCustomOrder: true,
        collegeName: userProfile.collegeName,
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        ID.unique(),
        newRequest
      );
      
      toast.success(`Your custom order request "${data.title}" has been posted!`);
      setIsPostCustomOrderDialogOpen(false);
    } catch (e: any) {
      console.error("Error posting custom request:", e);
      toast.error(e.message || "Failed to post custom request.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Food & Wellness</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Soup className="h-5 w-5 text-secondary-neon" /> Post Your Offerings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Post your homemade food or wellness remedies for your college peers to order.
            </p>
            <Dialog open={isPostServiceDialogOpen} onOpenChange={(open) => {
              setIsPostServiceDialogOpen(open);
              if (open) setShowOfferingFormInfoAlert(true); // Reset alert visibility when dialog opens
            }}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post New Offering
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader className="relative">
                  <DialogTitle className="text-foreground">Post New Food/Wellness Offering</DialogTitle>
                  {/* Removed the explicit close button here as requested */}
                </DialogHeader>
                {/* NEW: Scroll pane for dialog content */}
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2"> {/* Adjust height as needed */}
                  {showOfferingFormInfoAlert && ( // NEW: Conditionally render dismissible alert
                    <Alert className="bg-blue-50 border-blue-200 text-blue-800 flex items-center justify-between mb-4">
                      <AlertDescription>
                        Fill out the details to post your food or wellness offering.
                      </AlertDescription>
                      <Button variant="ghost" size="icon" onClick={() => setShowOfferingFormInfoAlert(false)} className="text-blue-800 hover:bg-blue-100">
                        <X className="h-4 w-4" />
                      </Button>
                    </Alert>
                  )}
                  <DeletionInfoMessage />
                  <PostServiceForm 
                    onSubmit={handlePostService} 
                    onCancel={() => setIsPostServiceDialogOpen(false)} 
                    categoryOptions={OFFERING_OPTIONS}
                    titlePlaceholder="e.g., Delicious Homemade Biryani"
                    descriptionPlaceholder="Describe your food or remedy, ingredients, benefits, etc."
                    pricePlaceholder="e.g., 150 INR per plate or 200 INR for a wellness drink"
                    contactPlaceholder="e.g., +91 9876543210 or @your_telegram_id"
                    ambassadorMessagePlaceholder="e.g., Deliver to Block A, Room 101 by 7 PM"
                  />
                </div> {/* END: Scroll pane */}
              </DialogContent>
            </Dialog>

            <Dialog open={isPostCustomOrderDialogOpen} onOpenChange={(open) => {
              setIsPostCustomOrderDialogOpen(open);
              if (open) setShowCustomOrderFormInfoAlert(true); // Reset alert visibility when dialog opens
            }}>
              <DialogTrigger asChild>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2">
                  <Utensils className="mr-2 h-4 w-4" /> Request Custom Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader className="relative">
                  <DialogTitle className="text-foreground">Request Custom Food/Remedy</DialogTitle>
                  {/* Removed the explicit close button here as requested */}
                </DialogHeader>
                {/* NEW: Scroll pane for dialog content */}
                <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2"> {/* Adjust height as needed */}
                  {showCustomOrderFormInfoAlert && ( // NEW: Conditionally render dismissible alert
                    <Alert className="bg-blue-50 border-blue-200 text-blue-800 flex items-center justify-between mb-4">
                      <AlertDescription>
                        Describe the custom food or remedy you need.
                      </AlertDescription>
                      <Button variant="ghost" size="icon" onClick={() => setShowCustomOrderFormInfoAlert(false)} className="text-blue-800 hover:bg-blue-100">
                        <X className="h-4 w-4" />
                      </Button>
                    </Alert>
                  )}
                  <DeletionInfoMessage />
                  <PostServiceForm 
                    onSubmit={handlePostCustomOrder} 
                    onCancel={() => setIsPostCustomOrderDialogOpen(false)} 
                    isCustomOrder={true}
                    categoryOptions={CUSTOM_REQUEST_OPTIONS}
                    titlePlaceholder="e.g., Request for Vegan Pasta"
                    descriptionPlaceholder="Describe the custom food or remedy you need, specific requirements, etc."
                    customOrderDescriptionPlaceholder="Specify details like ingredients, dietary restrictions, quantity, preferred time."
                    pricePlaceholder="e.g., 250 INR (negotiable) or Your budget"
                    contactPlaceholder="e.g., +91 9876543210 or @your_telegram_id"
                    ambassadorMessagePlaceholder="e.g., Pick up from my room, Block B, Room 205"
                  />
                </div> {/* END: Scroll pane */}
              </DialogContent>
            </Dialog>

            <p className="text-xs text-destructive-foreground mt-4 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Quality assurance and cancellation warnings apply.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Utensils className="h-5 w-5 text-secondary-neon" /> Custom Order Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading custom requests...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading requests: {error}</p>
            ) : postedCustomRequests.length > 0 ? (
              <FoodCustomRequestsList requests={postedCustomRequests} isLoading={isLoading} error={error} />
            ) : (
              <p className="text-center text-muted-foreground py-4">No custom requests posted yet for your college. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default FoodWellnessPage;