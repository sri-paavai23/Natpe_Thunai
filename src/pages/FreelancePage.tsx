"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, PlusCircle, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostServiceForm from "@/components/forms/PostServiceForm";
import ServiceListingCard from "@/components/ServiceListingCard";
import BargainServiceDialog from "@/components/forms/BargainServiceDialog";
import SubmitServiceReviewForm from "@/components/forms/SubmitServiceReviewForm"; // NEW: Import SubmitServiceReviewForm
import { useServiceListings, ServicePost } from "@/hooks/useServiceListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import * as z from "zod";

// Define the Zod schema for the PostServiceForm data (copied from PostServiceForm.tsx)
const ServiceFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  category: z.string().min(1, { message: "Please select a category." }),
  otherCategoryDescription: z.string().optional(), // For 'other' category
  price: z.string().min(1, { message: "Price is required." }),
  contact: z.string().min(5, { message: "Contact information is required." }),
  isCustomOrder: z.boolean().default(false),
});

const FREELANCE_CATEGORIES = [
  "academic-help", "tech-support", "design-creative", "writing-editing",
  "tutoring", "event-planning", "photography", "other"
];

const FREELANCE_CATEGORY_OPTIONS = [
  { value: "academic-help", label: "Academic Help" },
  { value: "tech-support", label: "Tech Support" },
  { value: "design-creative", label: "Design & Creative" },
  { value: "writing-editing", label: "Writing & Editing" },
  { value: "tutoring", label: "Tutoring" },
  { value: "event-planning", label: "Event Planning" },
  { value: "photography", label: "Photography" },
  { value: "other", label: "Other" },
];

const FreelancePage = () => {
  const { user, userProfile } = useAuth();
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);
  const [isBargainDialogOpen, setIsBargainDialogOpen] = useState(false);
  const [selectedServiceForBargain, setSelectedServiceForBargain] = useState<ServicePost | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false); // NEW: State for review dialog
  const [selectedServiceForReview, setSelectedServiceForReview] = useState<{ serviceId: string; sellerId: string; serviceTitle: string } | null>(null); // NEW: State for review dialog
  const [initialCategoryForForm, setInitialCategoryForForm] = useState<string | undefined>(undefined);

  const { services: freelanceListings, isLoading, error } = useServiceListings(FREELANCE_CATEGORIES);

  // Content is age-gated if user is 25 or older
  const isAgeGated = (userProfile?.age ?? 0) >= 25; 

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCategoryClick = (category: string) => {
    setInitialCategoryForForm(category);
    setIsPostServiceDialogOpen(true);
  };

  const handlePostService = async (data: z.infer<typeof ServiceFormSchema>) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a service.");
      return;
    }

    try {
      const newServiceData = {
        ...data,
        // If category is 'other' and otherCategoryDescription is empty, use otherCategoryDescription as the actual category
        category: data.category === 'other' && data.otherCategoryDescription 
                  ? data.otherCategoryDescription 
                  : data.category,
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
      setInitialCategoryForForm(undefined); // Clear preselected category
    } catch (e: any) {
      console.error("Error posting service:", e);
      toast.error(e.message || "Failed to post service listing.");
    }
  };

  const handleOpenBargainDialog = (service: ServicePost) => {
    if (!user || !userProfile) {
      toast.error("Please log in to bargain for a service.");
      return;
    }
    if (user.$id === service.posterId) {
      toast.error("You cannot bargain on your own service.");
      return;
    }
    setSelectedServiceForBargain(service);
    setIsBargainDialogOpen(true);
  };

  // NEW: Updated handleOpenReviewDialog to match ServiceListingCard's new prop signature
  const handleOpenReviewDialog = (serviceId: string, sellerId: string, serviceTitle: string) => {
    if (!user || !userProfile) {
      toast.error("Please log in to leave a review.");
      return;
    }
    if (user.$id === sellerId) {
      toast.error("You cannot review your own service.");
      return;
    }
    setSelectedServiceForReview({ serviceId, sellerId, serviceTitle });
    setIsReviewDialogOpen(true);
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
              Showcase your talents and offer services to your college community.
            </p>
            {FREELANCE_CATEGORY_OPTIONS.filter(option => option.value !== "other").map(option => (
              <Button
                key={option.value}
                className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => handleCategoryClick(option.value)}
              >
                <Briefcase className="mr-2 h-4 w-4" /> {option.label}
              </Button>
            ))}
            <Dialog open={isPostServiceDialogOpen} onOpenChange={setIsPostServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4" disabled={isAgeGated}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Post Your Service
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader className="relative">
                  <DialogTitle className="text-foreground">Post New Freelance Service</DialogTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:bg-muted"
                    onClick={() => setIsPostServiceDialogOpen(false)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </DialogHeader>
                <PostServiceForm 
                  onSubmit={handlePostService} 
                  onCancel={() => {
                    setIsPostServiceDialogOpen(false);
                    setInitialCategoryForForm(undefined);
                  }} 
                  categoryOptions={FREELANCE_CATEGORY_OPTIONS}
                  initialCategory={initialCategoryForForm}
                />
              </DialogContent>
            </Dialog>
            {isAgeGated && (
              <p className="text-xs text-destructive-foreground mt-4">
                Note: Posting services is disabled for users 25 or older.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Available Freelance Services</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading services...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading services: {error}</p>
            ) : freelanceListings.length > 0 ? (
              freelanceListings.map((service) => (
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

      {/* Bargain Dialog */}
      <Dialog open={isBargainDialogOpen} onOpenChange={setIsBargainDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Bargain for Service</DialogTitle>
          </DialogHeader>
          {selectedServiceForBargain && (
            <BargainServiceDialog
              service={selectedServiceForBargain}
              onBargainInitiated={() => setIsBargainDialogOpen(false)}
              onCancel={() => setIsBargainDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Leave a Review</DialogTitle>
          </DialogHeader>
          {selectedServiceForReview && (
            <SubmitServiceReviewForm
              serviceId={selectedServiceForReview.serviceId}
              sellerId={selectedServiceForReview.sellerId}
              serviceTitle={selectedServiceForReview.serviceTitle}
              onReviewSubmitted={() => setIsReviewDialogOpen(false)}
              onCancel={() => setIsReviewDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FreelancePage;