"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { HeartHandshake, Briefcase, Video, PenTool, Lightbulb, Utensils, PlusCircle } from "lucide-react"; // Added icons
import StudentWelfareLinks from "@/components/StudentWelfareLinks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // Import Dialog components
import PostServiceForm, { ServicePostData } from "@/components/forms/PostServiceForm"; // Import PostServiceForm and ServicePostData
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';

// Define category options for different service types
const FREELANCE_CATEGORY_OPTIONS = [
  { value: "resume-building", label: "Resume Building" },
  { value: "video-editing", label: "Video Editing" },
  { value: "content-writing", label: "Content Writing" },
  { value: "graphic-design", label: "Graphic Design" },
  { value: "tutoring", label: "Tutoring" },
  { value: "other", label: "Other" },
];

const SHORT_TERM_CATEGORY_OPTIONS = [
  { value: "urgent-delivery", label: "Urgent Delivery" },
  { value: "last-minute-help", label: "Last Minute Help" },
  { value: "event-setup", label: "Event Setup/Teardown" },
  { value: "quick-task", label: "Quick Task" },
  { value: "other", label: "Other" },
];

const ServicesPage = () => {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);
  const [initialServiceCategory, setInitialServiceCategory] = useState<string | undefined>(undefined);
  const [currentServiceType, setCurrentServiceType] = useState<"freelance" | "short-term" | undefined>(undefined);
  const [dialogTitle, setDialogTitle] = useState("Post New Service");

  const userAge = userProfile?.age || 0; 
  const isAgeGated = userAge >= 25; 

  const handleServiceClick = (path: string, serviceName: string) => {
    if (isAgeGated && (path === "/services/errands" || path === "/services/short-term" || path === "/services/food-wellness")) {
      toast.error(`Access denied: "${serviceName}" is not available for users aged 25 and above.`);
      return;
    }
    toast.info(`Navigating to "${serviceName}"...`);
    navigate(path);
  };

  // NEW: Function to open dialog with pre-filled category and service type
  const handleOpenPostServiceDialog = (type: "freelance" | "short-term", category?: string) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a service.");
      navigate("/auth");
      return;
    }
    if (isAgeGated && (type === "short-term")) { // Freelance is not age-gated
      toast.error(`Access denied: ${type === "short-term" ? "Short-Term Needs" : "This service"} is not available for users aged 25 and above.`);
      return;
    }
    setInitialServiceCategory(category);
    setCurrentServiceType(type);
    setDialogTitle(`Post New ${type === "freelance" ? "Freelance" : "Short-Term"} Service`);
    setIsPostServiceDialogOpen(true);
  };

  const handlePostService = async (data: ServicePostData) => {
    if (!user || !userProfile || !currentServiceType) {
      toast.error("User or service type information missing.");
      return;
    }

    try {
      const newServiceData = {
        ...data,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName,
        serviceType: currentServiceType, // Add serviceType
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        ID.unique(),
        newServiceData
      );
      
      toast.success(`Your ${currentServiceType} service "${data.title}" has been posted!`);
      setIsPostServiceDialogOpen(false);
      setInitialServiceCategory(undefined);
      setCurrentServiceType(undefined);
    } catch (e: any) {
      console.error("Error posting service:", e);
      toast.error(e.message || "Failed to post service listing.");
    }
  };

  const getServiceCategoryOptions = () => {
    if (currentServiceType === "freelance") return FREELANCE_CATEGORY_OPTIONS;
    if (currentServiceType === "short-term") return SHORT_TERM_CATEGORY_OPTIONS;
    return [];
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">The Grind (Services)</h1>
      <div className="max-w-md mx-auto space-y-6">
        {/* Tournament Card */}
        <Link to="/tournaments">
          <Card className="bg-card p-4 rounded-lg shadow-md border border-border cursor-pointer hover:shadow-xl transition-shadow">
            <CardHeader className="p-0 pb-2">
              <CardTitle className="text-xl font-semibold text-card-foreground">Esports Arena</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-muted-foreground">Register for mobile esports tournaments, view winners, and check standings.</p>
            </CardContent>
          </Card>
        </Link>
        
        {/* Student Welfare & E-commerce Links */}
        <StudentWelfareLinks />

        {/* Freelance Section Card */}
        <Card className="bg-card p-4 rounded-lg shadow-md border border-border hover:shadow-xl transition-shadow">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Freelance Section</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-2">
            <p className="text-sm text-muted-foreground">Resume Building, Video Editing, Content Writing, and more.</p>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleOpenPostServiceDialog("freelance", "resume-building")}
            >
              <Briefcase className="mr-2 h-4 w-4" /> Post Resume Building Service
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleOpenPostServiceDialog("freelance", "video-editing")}
            >
              <Video className="mr-2 h-4 w-4" /> Post Video Editing Service
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleOpenPostServiceDialog("freelance", "content-writing")}
            >
              <PenTool className="mr-2 h-4 w-4" /> Post Content Writing Service
            </Button>
            <Button
              className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-2"
              onClick={() => handleOpenPostServiceDialog("freelance")}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Post Other Freelance Service
            </Button>
            <Button
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary/10 mt-2"
              onClick={() => handleServiceClick("/services/freelance", "Freelance Listings")}
            >
              View All Freelance Listings
            </Button>
          </CardContent>
        </Card>

        {/* Errands Card (Age Gated) */}
        <Card 
          className={`bg-card p-4 rounded-lg shadow-md border border-border transition-shadow ${isAgeGated ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl'}`} 
          onClick={() => handleServiceClick("/services/errands", "Errands")}
        >
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Errands</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground">Note-writing, small jobs, delivery services {isAgeGated ? "(Access Denied)" : "(Age-Gated)"}.</p>
            <Button
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary/10 mt-2"
              onClick={() => handleServiceClick("/services/errands", "Errands Listings")}
              disabled={isAgeGated}
            >
              View All Errands
            </Button>
          </CardContent>
        </Card>

        {/* Short-Term Needs Card (Age Gated) */}
        <Card 
          className={`bg-card p-4 rounded-lg shadow-md border border-border transition-shadow ${isAgeGated ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl'}`} 
        >
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Short-Term Needs</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-2">
            <p className="text-sm text-muted-foreground">Instant requests with extra charges for urgent tasks {isAgeGated ? "(Access Denied)" : "(Age-Gated)"}.</p>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleOpenPostServiceDialog("short-term", "urgent-delivery")}
              disabled={isAgeGated}
            >
              <Lightbulb className="mr-2 h-4 w-4" /> Post Urgent Delivery Request
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleOpenPostServiceDialog("short-term", "last-minute-help")}
              disabled={isAgeGated}
            >
              <Lightbulb className="mr-2 h-4 w-4" /> Post Last Minute Help Request
            </Button>
            <Button
              className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-2"
              onClick={() => handleOpenPostServiceDialog("short-term")}
              disabled={isAgeGated}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Post Other Short-Term Need
            </Button>
            <Button
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary/10 mt-2"
              onClick={() => handleServiceClick("/services/short-term", "Short-Term Needs Listings")}
              disabled={isAgeGated}
            >
              View All Short-Term Needs
            </Button>
          </CardContent>
        </Card>

        {/* Food & Wellness Card (Age Gated) */}
        <Card 
          className={`bg-card p-4 rounded-lg shadow-md border border-border transition-shadow ${isAgeGated ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl'}`} 
          onClick={() => handleServiceClick("/services/food-wellness", "Food & Wellness")}
        >
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Food & Wellness</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground">Homemade food/remedies with cancellation warning and quality assurance {isAgeGated ? "(Access Denied)" : "(Age-Gated)"}.</p>
            <Button
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary/10 mt-2"
              onClick={() => handleServiceClick("/services/food-wellness", "Food & Wellness Listings")}
              disabled={isAgeGated}
            >
              View All Food & Wellness
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card p-4 rounded-lg shadow-md border border-border cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleServiceClick("/services/ticket-booking", "Ticket Booking")}>
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Ticket Booking</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground">IRCTC, Abhi Bus, Paytm redirection for easy travel bookings.</p>
            </CardContent>
        </Card>

        <Card className="bg-card p-4 rounded-lg shadow-md border border-border cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleServiceClick("/services/collaborators", "Project Collaborator Tab")}>
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Project Collaborator Tab</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground">Post or search for collaborators for academic or personal projects.</p>
          </CardContent>
        </Card>
        
        {/* Ambassador Program Card */}
        <Card className="bg-card p-4 rounded-lg shadow-md border border-border cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleServiceClick("/services/ambassador-program", "Ambassador Program")}>
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-secondary-neon" /> Ambassador Program
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground">Join our team to facilitate deliveries and ensure trust in transactions.</p>
          </CardContent>
        </Card>

        <Dialog open={isPostServiceDialogOpen} onOpenChange={setIsPostServiceDialogOpen}>
          <DialogTrigger asChild>
            {/* This DialogTrigger is intentionally empty as buttons directly open the dialog */}
            <Button className="hidden"></Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">{dialogTitle}</DialogTitle>
            </DialogHeader>
            {currentServiceType && (
              <PostServiceForm
                onSubmit={handlePostService}
                onCancel={() => {
                  setIsPostServiceDialogOpen(false);
                  setInitialServiceCategory(undefined);
                  setCurrentServiceType(undefined);
                }}
                categoryOptions={getServiceCategoryOptions()}
                initialCategory={initialServiceCategory}
                serviceType={currentServiceType}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ServicesPage;