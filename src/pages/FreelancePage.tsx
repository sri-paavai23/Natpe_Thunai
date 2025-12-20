"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, PlusCircle, Loader2, MessageSquareText, DollarSign, Star } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostServiceForm from "@/components/forms/PostServiceForm";
import { Link, useNavigate } from "react-router-dom";
import { useServiceListings, ServicePost } from "@/hooks/useServiceListings"; // Import useServiceListings
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID,APPWRITE_SERVICE_REVIEWS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import BargainServiceDialog from "@/components/forms/BargainServiceDialog";
import SubmitServiceReviewForm from "@/components/forms/SubmitServiceReviewForm";
import ServiceListingCard from "@/components/ServiceListingCard"; // Import ServiceListingCard

// Define service categories for posting
const FREELANCE_CATEGORIES = [
  { value: "resume-building", label: "Resume Building" },
  { value: "video-editing", label: "Video Editing" },
  { value: "content-writing", label: "Content Writing" },
  { value: "graphic-design", label: "Graphic Design" },
  { value: "other", label: "Other Freelance Service" },
];

const FreelancePage = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);
  const [isBargainServiceDialogOpen, setIsBargainServiceDialogOpen] = useState(false);
  const [selectedServiceForBargain, setSelectedServiceForBargain] = useState<ServicePost | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedServiceForReview, setSelectedServiceForReview] = useState<ServicePost | null>(null);

  // Fetch all service listings (no category filter)
  const { services: listings, isLoading, error } = useServiceListings(undefined); 

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
      toast.error("You must be logged in to post a service.");
      return;
    }

    try {
      const newServiceData = {
        ...data,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName,
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        ID.unique(),
        newServiceData
      );
      
      toast.success(`Your service "${data.title}" has been posted!`);
      setIsPostServiceDialogOpen(false);
    } catch (e: any) {
      console.error("Error posting service:", e);
      toast.error(e.message || "Failed to post service listing.");
    }
  };
  
  const handlePostJobRequest = () => {
    navigate("/services/post-job");
  };

  const handleOpenBargainDialog = (service: ServicePost) => {
    if (!user || !userProfile) {
      toast.error("Please log in to bargain for a service.");
      navigate("/auth");
      return;
    }
    if (user.$id === service.posterId) {
      toast.error("You cannot bargain on your own service.");
      return;
    }
    if (!userProfile.collegeName) {
      toast.error("Your profile is missing college information. Please update your profile first.");
      return;
    }
    setSelectedServiceForBargain(service);
    setIsBargainServiceDialogOpen(true);
  };

  const handleBargainInitiated = () => {
    setIsBargainServiceDialogOpen(false);
    // Further actions (e.g., navigate to tracking) are handled within BargainServiceDialog
  };

  const handleOpenReviewDialog = (service: ServicePost) => {
    if (!user || !userProfile) {
      toast.error("Please log in to leave a review.");
      navigate("/auth");
      return;
    }
    setSelectedServiceForReview(service);
    setIsReviewDialogOpen(true);
  };

  const handleReviewSubmitted = () => {
    setIsReviewDialogOpen(false);
    // Optionally refetch listings to update average ratings if they were displayed on the card
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Freelance Section</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-secondary-neon" /> Post a Service or Job
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Offer your skills or post a job request for campus freelancers (Fungro/Upwork style).
            </p>
            
            {/* Button for Posting a Job Request (Seeking Help) */}
            <Button 
              className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
              onClick={handlePostJobRequest}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Post a Job Request (Seeking Help)
            </Button>

            {/* Button for Posting a Service Offering */}
            <Dialog open={isPostServiceDialogOpen} onOpenChange={setIsPostServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post a Service Offering
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Service Offering</DialogTitle>
                </DialogHeader>
                <PostServiceForm 
                  onSubmit={handlePostService} 
                  onCancel={() => setIsPostServiceDialogOpen(false)} 
                  categoryOptions={FREELANCE_CATEGORIES} // Pass freelance categories
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* All Freelance Listings Section */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">All Freelance Listings</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading services...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading listings: {error}</p>
            ) : listings.length > 0 ? (
              listings.map((service) => (
                <ServiceListingCard
                  key={service.$id}
                  service={service}
                  onOpenBargainDialog={handleOpenBargainDialog}
                  onOpenReviewDialog={handleOpenReviewDialog}
                  isFoodOrWellnessCategory={false} // These are freelance, not food/wellness
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No freelance services posted yet for your college. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />

      {/* Bargain Service Dialog */}
      <Dialog open={isBargainServiceDialogOpen} onOpenChange={setIsBargainServiceDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Bargain for {selectedServiceForBargain?.title}</DialogTitle>
          </DialogHeader>
          {selectedServiceForBargain && (
            <BargainServiceDialog
              service={selectedServiceForBargain}
              onBargainInitiated={handleBargainInitiated}
              onCancel={() => setIsBargainServiceDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Review Service Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Leave a Review for {selectedServiceForReview?.title}</DialogTitle>
          </DialogHeader>
          {selectedServiceForReview && (
            <SubmitServiceReviewForm
              serviceId={selectedServiceForReview.$id}
              serviceTitle={selectedServiceForReview.title}
              onReviewSubmitted={handleReviewSubmitted}
              onCancel={() => setIsReviewDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FreelancePage;