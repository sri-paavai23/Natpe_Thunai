"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostFreelanceServiceForm from "@/components/forms/PostFreelanceServiceForm";
import { useServiceListings, ServicePost } from "@/hooks/useServiceListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import FreelanceServiceCard from "@/components/FreelanceServiceCard"; // Assuming this component will be created

const FreelancePage = () => {
  const { user, userProfile } = useAuth();
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);

  // Fetch all freelance related posts for the user's college
  const { services: allPosts, isLoading, error } = useServiceListings(undefined); 
  const freelanceServices = allPosts.filter(p => 
    p.category === "resume-building" || 
    p.category === "video-editing" || 
    p.category === "content-writing" || 
    p.category === "graphic-design" || 
    p.category === "tutoring" || 
    p.category === "web-development" || 
    p.category === "app-development" || 
    p.category === "photography" || 
    p.isCustomOtherCategory // Filter for custom "other" categories
  );

  const handlePostService = async (data: {
    title: string;
    description: string;
    category: string;
    otherCategory?: string;
    price: string;
    contact: string;
    ambassadorDelivery: boolean;
    ambassadorMessage: string;
  }) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a freelance service.");
      return;
    }

    try {
      const finalCategory = data.category === "other" && data.otherCategory
        ? data.otherCategory
        : data.category;

      const newPostData = {
        ...data,
        category: finalCategory,
        isCustomOtherCategory: data.category === "other", // Flag if it's a custom "other" category
        posterId: user.$id,
        posterName: user.name,
        isCustomOrder: false, // Freelance services are not custom orders in this context
        collegeName: userProfile.collegeName,
        posterAvatarStyle: userProfile.avatarStyle, // Include avatar style
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        ID.unique(),
        newPostData
      );
      
      toast.success(`Your freelance service "${data.title}" has been posted!`);
      setIsPostServiceDialogOpen(false);
    } catch (e: any) {
      console.error("Error posting freelance service:", e);
      toast.error(e.message || "Failed to post freelance service.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Freelance Section</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-secondary-neon" /> Offer Your Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Post your skills and services to help your college peers and earn some income.
            </p>
            <Dialog open={isPostServiceDialogOpen} onOpenChange={setIsPostServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post New Service
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Freelance Service</DialogTitle>
                </DialogHeader>
                <PostFreelanceServiceForm 
                  onSubmit={handlePostService} 
                  onCancel={() => setIsPostServiceDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
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
                <p className="ml-3 text-muted-foreground">Loading freelance services...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading services: {error}</p>
            ) : freelanceServices.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {freelanceServices.map((service) => (
                  <FreelanceServiceCard key={service.$id} service={service} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No freelance services posted yet for your college.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default FreelancePage;