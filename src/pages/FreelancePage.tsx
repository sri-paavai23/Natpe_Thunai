"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostServiceForm, { ServicePostData } from "@/components/forms/PostServiceForm";
import { useServiceListings, ServicePost } from "@/hooks/useServiceListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import ServiceListingCard from "@/components/ServiceListingCard"; // Import ServiceListingCard
import BargainServiceDialog from "@/components/forms/BargainServiceDialog"; // Import BargainServiceDialog

const FREELANCE_CATEGORY_OPTIONS = [
  { value: "resume-building", label: "Resume Building" },
  { value: "video-editing", label: "Video Editing" },
  { value: "content-writing", label: "Content Writing" },
  { value: "graphic-design", label: "Graphic Design" },
  { value: "tutoring", label: "Tutoring" },
  { value: "other", label: "Other" },
];

const FreelancePage = () => {
  const { user, userProfile } = useAuth();
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);
  const [initialServiceCategory, setInitialServiceCategory] = useState<string | undefined>(undefined);
  const [isBargainDialogOpen, setIsBargainDialogOpen] = useState(false);
  const [selectedServiceForBargain, setSelectedServiceForBargain] = useState<ServicePost | null>(null);

  const { services: freelanceListings, isLoading, error } = useServiceListings("freelance");

  const handleOpenPostServiceDialog = (category?: string) => {
    setInitialServiceCategory(category);
    setIsPostServiceDialogOpen(true);
  };

  const handlePostService = async (data: ServicePostData) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a freelance service.");
      return;
    }

    try {
      const newServiceData = {
        ...data,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName,
        serviceType: "freelance", // Explicitly set serviceType
        price: data.compensation, // Use compensation as price for now
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        ID.unique(),
        newServiceData
      );
      
      toast.success(`Your freelance service "${data.title}" has been posted!`);
      setIsPostServiceDialogOpen(false);
      setInitialServiceCategory(undefined);
    } catch (e: any) {
      console.error("Error posting freelance service:", e);
      toast.error(e.message || "Failed to post freelance service listing.");
    }
  };

  const handleViewDetails = (service: ServicePost) => {
    // Navigate to service details page
    toast.info(`Viewing details for "${service.title}"`);
    // navigate(`/services/freelance/${service.$id}`); // Uncomment if you have a details page
  };

  const handleBargain = (service: ServicePost) => {
    setSelectedServiceForBargain(service);
    setIsBargainDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Freelance Services</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-secondary-neon" /> Offer Your Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Showcase your talents and earn by providing services to your college peers!
            </p>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleOpenPostServiceDialog("resume-building")}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Post Resume Building Service
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleOpenPostServiceDialog("video-editing")}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Post Video Editing Service
            </Button>
            <Button
              className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4"
              onClick={() => handleOpenPostServiceDialog()}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Post Other Freelance Service
            </Button>
            <Dialog open={isPostServiceDialogOpen} onOpenChange={setIsPostServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="hidden"></Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Freelance Service</DialogTitle>
                </DialogHeader>
                <PostServiceForm
                  onSubmit={handlePostService}
                  onCancel={() => { setIsPostServiceDialogOpen(false); setInitialServiceCategory(undefined); }}
                  categoryOptions={FREELANCE_CATEGORY_OPTIONS}
                  initialCategory={initialServiceCategory}
                  serviceType="freelance" // Pass the required serviceType prop
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Available Freelance Listings</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading freelance services...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading services: {error}</p>
            ) : freelanceListings.length > 0 ? (
              freelanceListings.map((service) => (
                <ServiceListingCard
                  key={service.$id}
                  service={service}
                  onViewDetails={handleViewDetails}
                  onBargain={handleBargain}
                  // Assuming sellerLevel can be derived or passed if available
                  // sellerLevel={service.posterLevel} 
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No freelance services posted yet for your college. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      {selectedServiceForBargain && (
        <BargainServiceDialog
          isOpen={isBargainDialogOpen}
          onClose={() => setIsBargainDialogOpen(false)}
          service={selectedServiceForBargain}
        />
      )}
      <MadeWithDyad />
    </div>
  );
};

export default FreelancePage;