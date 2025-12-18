"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, HeartPulse, PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostServiceForm from "@/components/forms/PostServiceForm";
import { useServiceListings, ServicePost } from "@/hooks/useServiceListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import FoodOfferingCard from "@/components/FoodOfferingCard"; // Corrected import
import FoodCustomRequestsList from "@/components/FoodCustomRequestsList";

const FOOD_WELLNESS_CATEGORIES = ["food-wellness", "other"];
const OFFERING_CATEGORIES = ["food-wellness"];

const OFFERING_OPTIONS = [
  { value: "food-wellness", label: "Food & Wellness Offering" },
  { value: "homemade-meals", label: "Homemade Meals" },
  { value: "healthy-snacks", label: "Healthy Snacks" },
  { value: "wellness-products", label: "Wellness Products" },
  { value: "other", label: "Other" },
];

const CUSTOM_REQUEST_OPTIONS = [
  { value: "custom-food", label: "Custom Food Request" },
  { value: "dietary-needs", label: "Dietary Needs" },
  { value: "event-catering", label: "Event Catering" },
  { value: "other", label: "Other" },
];

const FoodWellnessPage = () => {
  const { user, userProfile } = useAuth();
  const [isPostOfferingDialogOpen, setIsPostOfferingDialogOpen] = useState(false);
  const [isPostCustomOrderDialogOpen, setIsPostCustomOrderDialogOpen] = useState(false);
  
  const { services: allPosts, isLoading, error } = useServiceListings(FOOD_WELLNESS_CATEGORIES);

  const postedOfferings = allPosts.filter(p => !p.isCustomOrder && OFFERING_CATEGORIES.includes(p.category));
  const postedCustomRequests = allPosts.filter(p => p.isCustomOrder);

  const isAgeGated = (userProfile?.age ?? 0) >= 25; 

  const handlePostService = async (data: Omit<ServicePost, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "providerId" | "providerName" | "collegeName">) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post.");
      return;
    }

    try {
      const newServiceData = {
        ...data,
        providerId: user.$id,
        providerName: user.name,
        collegeName: userProfile.collegeName,
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        ID.unique(),
        newServiceData
      );
      
      toast.success(`Your ${data.isCustomOrder ? "custom request" : "offering"} "${data.title}" has been posted!`);
      setIsPostOfferingDialogOpen(false);
      setIsPostCustomOrderDialogOpen(false);
    } catch (e: any) {
      console.error("Error posting service:", e);
      toast.error(e.message || "Failed to post.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Food & Wellness</h1>
      <div className="max-w-md mx-auto space-y-6">
        {/* Post New Offering Card */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Utensils className="h-5 w-5 text-secondary-neon" /> Offer Food/Wellness
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Share your homemade meals, healthy snacks, or wellness products with the campus community.
            </p>
            <Dialog open={isPostOfferingDialogOpen} onOpenChange={setIsPostOfferingDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4" disabled={isAgeGated}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Post New Offering
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Food/Wellness Offering</DialogTitle>
                </DialogHeader>
                <PostServiceForm 
                  onSubmit={handlePostService} 
                  onCancel={() => setIsPostOfferingDialogOpen(false)} 
                  categoryOptions={OFFERING_OPTIONS}
                  titlePlaceholder="e.g., Delicious Homemade Biryani"
                  descriptionPlaceholder="Describe your food or remedy, ingredients, benefits, etc."
                  pricePlaceholder="e.g., ₹150/plate, ₹200/bottle"
                  compensationPlaceholder="e.g., Cash, UPI"
                  deadlinePlaceholder="e.g., Available daily, Pre-order by 5 PM"
                  contactPlaceholder="e.g., WhatsApp, Instagram"
                  isCustomOrder={false}
                  showAmbassadorDelivery={true}
                  ambassadorMessagePlaceholder="e.g., 'Deliver to hostel block C, room 201'"
                />
              </DialogContent>
            </Dialog>
            <p className="text-xs text-destructive-foreground mt-4">
              Note: This section is age-gated for users under 25.
            </p>
          </CardContent>
        </Card>

        {/* Request Custom Order Card */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-secondary-neon" /> Request Custom Order
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Need something specific? Post a custom request for food or wellness items.
            </p>
            <Dialog open={isPostCustomOrderDialogOpen} onOpenChange={setIsPostCustomOrderDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4" disabled={isAgeGated}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Request Custom Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Custom Food/Wellness Request</DialogTitle>
                </DialogHeader>
                <PostServiceForm 
                  onSubmit={handlePostService} 
                  onCancel={() => setIsPostCustomOrderDialogOpen(false)} 
                  isCustomOrder={true}
                  categoryOptions={CUSTOM_REQUEST_OPTIONS}
                  titlePlaceholder="e.g., Vegan Meal Prep Request"
                  descriptionPlaceholder="Briefly describe your custom food or wellness need."
                  customOrderDescriptionPlaceholder="Provide detailed requirements: ingredients, dietary restrictions, quantity, desired delivery date, etc."
                  pricePlaceholder="e.g., ₹1000 (budget), Negotiable"
                  compensationPlaceholder="e.g., Cash, UPI"
                  deadlinePlaceholder="e.g., Need by Friday evening"
                  contactPlaceholder="e.g., WhatsApp, Email"
                  showAmbassadorDelivery={false}
                />
              </DialogContent>
            </Dialog>
            <p className="text-xs text-destructive-foreground mt-4">
              Note: This section is age-gated for users under 25.
            </p>
          </CardContent>
        </Card>

        {/* Recently Posted Offerings */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Recently Posted Offerings</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading offerings...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading offerings: {error}</p>
            ) : postedOfferings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {postedOfferings.map((offering) => (
                  <FoodOfferingCard key={offering.$id} offering={offering} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No food or wellness offerings posted yet for your college. Be the first!</p>
            )}
          </CardContent>
        </Card>

        {/* Recently Posted Custom Requests */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Recently Posted Custom Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading custom requests...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading custom requests: {error}</p>
            ) : postedCustomRequests.length > 0 ? (
              <FoodCustomRequestsList customRequests={postedCustomRequests} />
            ) : (
              <p className="text-center text-muted-foreground py-4">No custom food or wellness requests posted yet for your college.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default FoodWellnessPage;