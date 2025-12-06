"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle, ArrowLeft, Briefcase, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useParams, useNavigate } from "react-router-dom";
import PostServiceForm from "@/components/forms/PostServiceForm";
import { useServiceListings, ServicePost } from "@/hooks/useServiceListings"; // Import hook and interface
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";

// Helper function to format category slug into readable title
const formatCategoryTitle = (categorySlug: string | undefined) => {
  if (!categorySlug || categorySlug === "all") return "All Service Listings"; // NEW: Handle "all" category
  return categorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const ServiceListingPage = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);
  
  // Use the real-time hook, filtering by the URL category slug
  // The hook itself now handles collegeName filtering internally
  const { services: listings, isLoading, error, refetch } = useServiceListings(category === "all" ? undefined : category); // NEW: Pass undefined for "all" category

  const formattedCategory = formatCategoryTitle(category);

  const handlePostService = async (data: Omit<ServicePost, "id" | "datePosted" | "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "posterId" | "posterName" | "collegeName">) => { // NEW: Remove collegeName from Omit
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a service.");
      return;
    }

    try {
      const newServiceData = {
        ...data,
        posterId: user.$id,
        posterName: user.name,
        // Ensure category matches the page context if not explicitly set in form
        category: category === "all" ? data.category : category, // NEW: Handle "all" category
        collegeName: userProfile.collegeName, // Ensure collegeName is explicitly added
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        ID.unique(),
        newServiceData
      );
      
      toast.success(`Your service "${data.title}" has been posted!`);
      setIsPostServiceDialogOpen(false);
      // The hook subscription will automatically update the list (no manual refetch needed)
    } catch (e: any) {
      console.error("Error posting service:", e);
      toast.error(e.message || "Failed to post service listing.");
    }
  };

  const handleContactSeller = (contact: string, title: string) => {
    toast.info(`Contacting provider for "${title}" at ${contact}.`);
    // In a real app, this would open a chat or email client.
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-secondary-neon">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Freelance
        </Button>
        
        <h1 className="text-4xl font-bold text-center text-foreground">{formattedCategory}</h1>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-secondary-neon" /> Available Services
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Browse services offered by peers in the {formattedCategory} category for your college.
            </p>
            <Dialog open={isPostServiceDialogOpen} onOpenChange={setIsPostServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post Your Service
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New {formattedCategory} Service</DialogTitle>
                </DialogHeader>
                <PostServiceForm 
                  onSubmit={handlePostService} 
                  onCancel={() => setIsPostServiceDialogOpen(false)} 
                  initialCategory={category === "all" ? "" : category} // NEW: Pass empty string for "all"
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Current Listings</CardTitle>
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
                <div key={service.$id} className="p-3 border border-border rounded-md bg-background flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div>
                    <h3 className="font-semibold text-foreground">{service.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Price: <span className="font-medium text-secondary-neon">{service.price}</span></p>
                    <p className="text-xs text-muted-foreground">Posted by: {service.posterName}</p>
                    <p className="text-xs text-muted-foreground">Posted: {new Date(service.$createdAt).toLocaleDateString()}</p>
                  </div>
                  <Button 
                    size="sm" 
                    className="mt-2 sm:mt-0 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => handleContactSeller(service.contact, service.title)}
                  >
                    Contact Provider
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No services posted in this category yet for your college. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ServiceListingPage;