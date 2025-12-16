"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Utensils,
  BookOpen,
  HeartPulse,
  Search,
  PlusCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostServiceForm from "@/components/forms/PostServiceForm";
import { useServiceListings, ServicePost } from "@/hooks/useServiceListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from "appwrite";
import { useAuth } from "@/context/AuthContext";
import CampusServicesCard from "@/components/CampusServicesCard"; // NEW IMPORT

const SERVICE_TYPES = ["freelance", "food-wellness", "academic-support"];

const STANDARD_SERVICE_OPTIONS = [
  { value: "freelance", label: "Freelance Gigs" },
  { value: "food-wellness", label: "Food & Wellness" },
  { value: "academic-support", label: "Academic Support" },
  { value: "other", label: "Other" },
];

const ServicesPage = () => {
  const { user, userProfile } = useAuth();
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);
  const [initialCategoryForForm, setInitialCategoryForForm] = useState<string | undefined>(undefined);

  const { services: postedServices, isLoading, error } = useServiceListings(SERVICE_TYPES);

  const isAgeGated = (userProfile?.age ?? 0) >= 25;

  const handleServiceClick = (categoryValue: string) => {
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
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        ID.unique(),
        newServiceData
      );

      toast.success(`Your service "${data.title}" has been posted!`);
      setIsPostServiceDialogOpen(false);
      setInitialCategoryForForm(undefined);
    } catch (e: any) {
      console.error("Error posting service:", e);
      toast.error(e.message || "Failed to post service listing.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Services Hub</h1>
      <div className="max-w-md mx-auto space-y-6">
        {/* Campus Services Card - NEWLY ADDED HERE */}
        <CampusServicesCard />

        {/* Freelance Gigs Card */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-secondary-neon" /> Freelance Gigs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Offer your skills or find freelancers for various tasks.
            </p>
            <Link to="/services/freelance" className="block">
              <Button className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90">
                <Search className="mr-2 h-4 w-4" /> Browse Freelance Gigs
              </Button>
            </Link>
            <Button
              className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4"
              disabled={isAgeGated}
              onClick={() => handleServiceClick("freelance")}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Post Your Service
            </Button>
            <p className="text-xs text-destructive-foreground mt-4">
              Note: This section is age-gated for users under 25.
            </p>
          </CardContent>
        </Card>

        {/* Food & Wellness Card */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Utensils className="h-5 w-5 text-secondary-neon" /> Food & Wellness
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Find homemade meals, healthy snacks, or wellness services on campus.
            </p>
            <Link to="/services/food-wellness" className="block">
              <Button className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90">
                <Search className="mr-2 h-4 w-4" /> Browse Food & Wellness
              </Button>
            </Link>
            <Button
              className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4"
              disabled={isAgeGated}
              onClick={() => handleServiceClick("food-wellness")}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Post Your Offering
            </Button>
            <p className="text-xs text-destructive-foreground mt-4">
              Note: This section is age-gated for users under 25.
            </p>
          </CardContent>
        </Card>

        {/* Academic Support Card */}
        <Card className="bg-card text-card-foreground shadow-lg border-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-secondary-neon" /> Academic Support
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Connect with tutors, study groups, or find help with assignments.
            </p>
            <Link to="/services/academic-support" className="block">
              <Button className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90">
                <Search className="mr-2 h-4 w-4" /> Browse Academic Support
              </Button>
            </Link>
            <Button
              className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4"
              disabled={isAgeGated}
              onClick={() => handleServiceClick("academic-support")}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Offer Academic Help
            </Button>
            <p className="text-xs text-destructive-foreground mt-4">
              Note: This section is age-gated for users under 25.
            </p>
          </CardContent>
        </Card>

        {/* Dialog for posting a new service */}
        <Dialog open={isPostServiceDialogOpen} onOpenChange={setIsPostServiceDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Post New Service</DialogTitle>
            </DialogHeader>
            <PostServiceForm
              onSubmit={handlePostService}
              onCancel={() => {
                setIsPostServiceDialogOpen(false);
                setInitialCategoryForForm(undefined);
              }}
              categoryOptions={STANDARD_SERVICE_OPTIONS}
              initialCategory={initialCategoryForForm}
            />
          </DialogContent>
        </Dialog>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Recently Posted Services</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading services...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading services: {error}</p>
            ) : postedServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {postedServices.map((service) => (
                  <div key={service.$id} className="p-3 border border-border rounded-md bg-background">
                    <h3 className="font-semibold text-foreground">{service.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Category: <span className="font-medium text-foreground">{STANDARD_SERVICE_OPTIONS.find(opt => opt.value === service.category)?.label || service.category}</span></p>
                    {service.category === 'other' && service.otherCategoryDescription && (
                      <p className="text-xs text-muted-foreground">Other: <span className="font-medium text-foreground">{service.otherCategoryDescription}</span></p>
                    )}
                    <p className="text-xs text-muted-foreground">Compensation: <span className="font-medium text-foreground">{service.compensation}</span></p>
                    {service.deadline && <p className="text-xs text-muted-foreground">Deadline: <span className="font-medium text-foreground">{service.deadline}</span></p>}
                    <p className="text-xs text-muted-foreground">Contact: <span className="font-medium text-foreground">{service.contact}</span></p>
                    <p className="text-xs text-muted-foreground">Posted: {new Date(service.$createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No services posted yet for your college. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ServicesPage;