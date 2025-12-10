"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, Heart, PlusCircle, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostFoodOfferingForm, { FoodOfferingPostData } from "@/components/forms/PostFoodOfferingForm"; // Import PostFoodOfferingForm
import RequestCustomOrderForm, { FoodRequestPostData } from "@/components/forms/RequestCustomOrderForm"; // Import RequestCustomOrderForm
import { useFoodOfferings, FoodOffering, FoodRequest } from "@/hooks/useFoodOfferings"; // Import useFoodOfferings hook
import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_OFFERINGS_COLLECTION_ID, APPWRITE_FOOD_REQUESTS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import FoodOfferingCard from "@/components/FoodOfferingCard"; // Import FoodOfferingCard
import FoodCustomRequestsList from "@/components/FoodCustomRequestsList"; // Import FoodCustomRequestsList

// Category options for offerings
const OFFERING_CATEGORY_OPTIONS = [
  { value: "homemade-meal", label: "Homemade Meal" },
  { value: "home-remedy", label: "Home Remedy" },
  { value: "baked-goods", label: "Baked Goods" },
  { value: "snacks", label: "Snacks" },
  { value: "other", label: "Other" },
];

// Category options for requests
const REQUEST_CATEGORY_OPTIONS = [
  { value: "custom-meal", label: "Custom Meal" },
  { value: "special-remedy", label: "Special Remedy" },
  { value: "dietary-specific", label: "Dietary Specific" },
  { value: "event-catering", label: "Event Catering" },
  { value: "other", label: "Other" },
];

const FoodWellnessPage = () => {
  const { user, userProfile } = useAuth();
  const [isPostOfferingDialogOpen, setIsPostOfferingDialogOpen] = useState(false);
  const [isRequestOrderDialogOpen, setIsRequestOrderDialogOpen] = useState(false);
  const [initialOfferingCategory, setInitialOfferingCategory] = useState<string | undefined>(undefined);
  const [initialRequestCategory, setInitialRequestCategory] = useState<string | undefined>(undefined);
  
  const { offerings, requests, isLoadingOfferings, isLoadingRequests, errorOfferings, errorRequests } = useFoodOfferings();

  const isAgeGated = (userProfile?.age ?? 0) >= 25; 

  // NEW: Function to open Post Offering dialog with pre-filled category
  const handleOpenPostOfferingDialog = (category?: string) => {
    if (isAgeGated) {
      toast.error("Access denied: Food & Wellness offerings are not available for users aged 25 and above.");
      return;
    }
    setInitialOfferingCategory(category);
    setIsPostOfferingDialogOpen(true);
  };

  // NEW: Function to open Request Order dialog with pre-filled category
  const handleOpenRequestOrderDialog = (category?: string) => {
    if (isAgeGated) {
      toast.error("Access denied: Food & Wellness requests are not available for users aged 25 and above.");
      return;
    }
    setInitialRequestCategory(category);
    setIsRequestOrderDialogOpen(true);
  };

  const handlePostOffering = async (data: FoodOfferingPostData) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post an offering.");
      return;
    }

    try {
      const newOfferingData = {
        ...data,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName,
        status: "available", // Default status
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_OFFERINGS_COLLECTION_ID,
        ID.unique(),
        newOfferingData
      );
      
      toast.success(`Your offering "${data.title}" has been posted!`);
      setIsPostOfferingDialogOpen(false);
      setInitialOfferingCategory(undefined);
    } catch (e: any) {
      console.error("Error posting offering:", e);
      toast.error(e.message || "Failed to post food offering.");
    }
  };

  const handleRequestOrder = async (data: FoodRequestPostData) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to request an order.");
      return;
    }

    try {
      const newRequestData = {
        ...data,
        requesterId: user.$id,
        requesterName: user.name,
        collegeName: userProfile.collegeName,
        status: "open", // Default status
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_REQUESTS_COLLECTION_ID,
        ID.unique(),
        newRequestData
      );
      
      toast.success(`Your custom order request "${data.title}" has been posted!`);
      setIsRequestOrderDialogOpen(false);
      setInitialRequestCategory(undefined);
    } catch (e: any) {
      console.error("Error requesting order:", e);
      toast.error(e.message || "Failed to request custom order.");
    }
  };

  const handleViewOfferingDetails = (offering: FoodOffering) => {
    toast.info(`Viewing details for "${offering.title}"`);
    // navigate(`/services/food-wellness/${offering.$id}`); // Uncomment if you have a details page
  };

  const handlePlaceOrder = (offering: FoodOffering) => {
    toast.info(`Placing order for "${offering.title}"`);
    // This would typically open a PlaceFoodOrderForm dialog
    // For now, just a toast.
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Food & Wellness</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Utensils className="h-5 w-5 text-secondary-neon" /> Campus Kitchen
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Share your culinary skills or find delicious homemade food and wellness remedies from peers!
            </p>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleOpenPostOfferingDialog("homemade-meal")} // Prefill
              disabled={isAgeGated}
            >
              <Utensils className="mr-2 h-4 w-4" /> Post Homemade Meal
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleOpenPostOfferingDialog("home-remedy")} // Prefill
              disabled={isAgeGated}
            >
              <Heart className="mr-2 h-4 w-4" /> Post Home Remedy
            </Button>
            <Dialog open={isPostOfferingDialogOpen} onOpenChange={setIsPostOfferingDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4" disabled={isAgeGated} onClick={() => handleOpenPostOfferingDialog()}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Post New Offering
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Food/Wellness Offering</DialogTitle>
                </DialogHeader>
                <PostFoodOfferingForm 
                  onSubmit={handlePostOffering} 
                  onCancel={() => { setIsPostOfferingDialogOpen(false); setInitialOfferingCategory(undefined); }} 
                  categoryOptions={OFFERING_CATEGORY_OPTIONS}
                  initialCategory={initialOfferingCategory} // Pass initial category
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
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-secondary-neon" /> Custom Order Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Can't find what you need? Request a custom meal or remedy from your peers!
            </p>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleOpenRequestOrderDialog("custom-meal")} // Prefill
              disabled={isAgeGated}
            >
              <Utensils className="mr-2 h-4 w-4" /> Request Custom Meal
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleOpenRequestOrderDialog("special-remedy")} // Prefill
              disabled={isAgeGated}
            >
              <Heart className="mr-2 h-4 w-4" /> Request Special Remedy
            </Button>
            <Dialog open={isRequestOrderDialogOpen} onOpenChange={setIsRequestOrderDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4" disabled={isAgeGated} onClick={() => handleOpenRequestOrderDialog()}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Request Custom Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Request New Custom Order</DialogTitle>
                </DialogHeader>
                <RequestCustomOrderForm 
                  onSubmit={handleRequestOrder} 
                  onCancel={() => { setIsRequestOrderDialogOpen(false); setInitialRequestCategory(undefined); }} 
                  categoryOptions={REQUEST_CATEGORY_OPTIONS}
                  initialCategory={initialRequestCategory} // Pass initial category
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
            <CardTitle className="text-xl font-semibold text-card-foreground">Available Offerings</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoadingOfferings ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading offerings...</p>
              </div>
            ) : errorOfferings ? (
              <p className="text-center text-destructive py-4">Error loading offerings: {errorOfferings}</p>
            ) : offerings.length > 0 ? (
              offerings.map((offering) => (
                <FoodOfferingCard
                  key={offering.$id}
                  offering={offering}
                  onViewDetails={handleViewOfferingDetails}
                  onPlaceOrder={handlePlaceOrder}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No offerings posted yet for your college. Be the first!</p>
            )}
          </CardContent>
        </Card>

        <FoodCustomRequestsList requests={requests} isLoading={isLoadingRequests} error={errorRequests} />
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default FoodWellnessPage;