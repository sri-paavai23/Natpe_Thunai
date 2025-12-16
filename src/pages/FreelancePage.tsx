"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostServiceForm from "@/components/forms/PostServiceForm";
import { useServiceListings, ServicePost } from "@/hooks/useServiceListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import ServiceListingCard from "@/components/ServiceListingCard";

const FREELANCE_CATEGORIES = ["freelance", "other"];

const STANDARD_FREELANCE_OPTIONS = [
  { value: "freelance", label: "General Freelance" },
  { value: "academic-tutoring", label: "Academic Tutoring" },
  { value: "graphic-design", label: "Graphic Design" },
  { value: "web-development", label: "Web Development" },
  { value: "content-writing", label: "Content Writing" },
  { value: "photography", label: "Photography" },
  { value: "video-editing", label: "Video Editing" },
  { value: "music-lessons", label: "Music Lessons" },
  { value: "other", label: "Other" },
];

const FreelancePage = () => {
  const { user, userProfile } = useAuth();
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);
  const [initialCategoryForForm, setInitialCategoryForForm] = useState<string | undefined>(undefined);
  
  const { services: postedServices, isLoading, error } = useServiceListings(FREELANCE_CATEGORIES);

  const isAgeGated = (userProfile?.age ?? 0) >= 25; 

  const handlePostServiceClick = (categoryValue?: string) => {
    if (!user) {
      toast.error("You must be logged in to post a service.");
      return;
    }
    setInitialCategoryForForm(categoryValue);
    setIsPostServiceDialogOpen(true);
  };

  const handlePostService = async (data: Omit<ServicePost, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "providerId" | "providerName" | "collegeName">) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a service.");
      return;
    }

    try {
      const newServiceData = {
        ...data,
        providerId: user.$id,
        providerName: user.name,
        collegeName: userProfile.collegeName,
        isCustomOrder: false, // Freelance gigs are not custom orders
        ambassadorDelivery: false, // Not applicable for freelance
        ambassadorMessage: "", // Not applicable for freelance
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        ID.unique(),
        newServiceData
      );
      
      toast.success(`Your freelance service "${data.title}" has been posted!`);
      setIsPostServiceDialogOpen(false);
      setInitialCategoryForForm(undefined);
    } catch (e: any) {
      console.error("Error posting service:", e);
      toast.error(e.message || "Failed to post service listing.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Freelance Gigs</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-secondary-neon" /> Offer Your Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Post your freelance services and connect with peers who need your expertise.
            </p>
            <Dialog open={isPostServiceDialogOpen} onOpenChange={setIsPostServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4" disabled={isAgeGated} onClick={() => handlePostServiceClick()}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Post Your Service
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Freelance Service</DialogTitle>
                </DialogHeader>
                <PostServiceForm 
                  onSubmit={handlePostService} 
                  onCancel={() => {
                    setIsPostServiceDialogOpen(false);
                    setInitialCategoryForForm(undefined);
                  }} 
                  categoryOptions={STANDARD_FREELANCE_OPTIONS}
                  initialCategory={initialCategoryForForm}
                  titlePlaceholder="e.g., Graphic Design Services"
                  descriptionPlaceholder="Describe your design expertise, portfolio, and services offered."
                  pricePlaceholder="e.g., ₹500/logo, ₹1000/project"
                  compensationPlaceholder="e.g., Flexible rates, Project-based"
                  deadlinePlaceholder="e.g., 2-3 days per project"
                  contactPlaceholder="e.g., Email, Portfolio link"
                  isCustomOrder={false}
                  showAmbassadorDelivery={false}
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
            <CardTitle className="text-xl font-semibold text-card-foreground">Available Freelance Gigs</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading freelance gigs...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading gigs: {error}</p>
            ) : postedServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {postedServices.map((service) => (
                  <ServiceListingCard key={service.$id} service={service} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No freelance gigs posted yet for your college. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default FreelancePage;