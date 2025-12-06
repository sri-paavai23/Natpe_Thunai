"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Soup, HeartPulse, ShieldCheck, PlusCircle, Utensils, Loader2, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostServiceForm from "@/components/forms/PostServiceForm";
import { useServiceListings, ServicePost } from "@/hooks/useServiceListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import FoodOfferingCard from "@/components/FoodOfferingCard"; // NEW IMPORT

// Service categories specific to this page
const OFFERING_CATEGORIES = ["homemade-meals", "wellness-remedies"];

// Define category options for Offerings
const OFFERING_OPTIONS = [
  { value: "homemade-meals", label: "Food" },
  { value: "wellness-remedies", label: "Remedy" },
  { value: "other", label: "Other" },
];

// Define category options for Custom Requests
const CUSTOM_REQUEST_OPTIONS = [
  { value: "homemade-meals", label: "Custom Food" },
  { value: "wellness-remedies", label: "Custom Remedy" },
  { value: "other", label: "Other" },
];


const FoodWellnessPage = () => {
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth(); // NEW: Get incrementAmbassadorDeliveriesCount
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);
  const [isPostCustomOrderDialogOpen, setIsPostCustomOrderDialogOpen] = useState(false);
  
  // Fetch all food/wellness related posts for the user's college
  const { services: allPosts, isLoading, error } = useServiceListings(undefined); 

  const postedOfferings = allPosts.filter(p => !p.isCustomOrder && OFFERING_CATEGORIES.includes(p.category));
  const postedCustomRequests = allPosts.filter(p => p.isCustomOrder);

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
      toast.error("You must be logged in to post.");
      return;
    }

    try {
      const newPostData = {
        ...data,
        posterId: user.$id,
        posterName: user.name,
        isCustomOrder: false,
        collegeName: userProfile.collegeName, // Ensure collegeName is explicitly added
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        ID.unique(),
        newPostData
      );
      
      toast.success(`Your offering "${data.title}" has been posted!`);
      setIsPostServiceDialogOpen(false);
    } catch (e: any) {
      console.error("Error posting service:", e);
      toast.error(e.message || "Failed to post offering.");
    }
  };

  const handlePostCustomOrder = async (data: {
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
      toast.error("You must be logged in to post a custom request.");
      return;
    }

    try {
      const newRequest = {
        ...data,
        posterId: user.$id,
        posterName: user.name,
        isCustomOrder: true,
        collegeName: userProfile.collegeName, // Ensure collegeName is explicitly added
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        ID.unique(),
        newRequest
      );
      
      toast.success(`Your custom order request "${data.title}" has been posted!`);
      setIsPostCustomOrderDialogOpen(false);
    } catch (e: any) {
      console.error("Error posting custom request:", e);
      toast.error(e.message || "Failed to post custom request.");
    }
  };

  const renderCustomRequests = (list: ServicePost[]) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
          <p className="ml-3 text-muted-foreground">Loading requests...</p>
        </div>
      );
    }
    if (error) {
      return <p className="text-center text-destructive py-4">Error loading requests: {error}</p>;
    }
    if (list.length === 0) {
      return <p className="text-center text-muted-foreground py-4">No custom order requests posted yet for your college.</p>;
    }

    return list.map((post) => (
      <div key={post.$id} className="p-3 border border-border rounded-md bg-background">
        <h3 className="font-semibold text-foreground">{post.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{post.description}</p>
        {post.isCustomOrder && post.customOrderDescription && (
          <p className="text-xs text-muted-foreground mt-1">Details: <span className="font-medium text-foreground">{post.customOrderDescription}</span></p>
        )}
        <p className="text-xs text-muted-foreground mt-1">Category: <span className="font-medium text-foreground">{post.category}</span></p>
        <p className="text-xs text-muted-foreground">{post.isCustomOrder ? "Budget" : "Price"}: <span className="font-medium text-foreground">{post.price}</span></p>
        <p className="text-xs text-muted-foreground">Posted by: {post.posterName}</p>
        <p className="text-xs text-muted-foreground">Posted: {new Date(post.$createdAt).toLocaleDateString()}</p>
        <Button 
          size="sm" 
          variant="outline" 
          className="mt-2 border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10"
          onClick={() => toast.info(`Contacting ${post.posterName} at ${post.contact} to fulfill this request.`)}
        >
          <MessageSquareText className="mr-2 h-4 w-4" /> Offer to Fulfill
        </Button>
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Food & Wellness</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Soup className="h-5 w-5 text-secondary-neon" /> Post Your Offerings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Post your homemade food or wellness remedies for your college peers to order.
            </p>
            <Dialog open={isPostServiceDialogOpen} onOpenChange={setIsPostServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post New Offering
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Food/Wellness Offering</DialogTitle>
                </DialogHeader>
                <PostServiceForm 
                  onSubmit={handlePostService} 
                  onCancel={() => setIsPostServiceDialogOpen(false)} 
                  categoryOptions={OFFERING_OPTIONS}
                />
              </DialogContent>
            </Dialog>

            <Dialog open={isPostCustomOrderDialogOpen} onOpenChange={setIsPostCustomOrderDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2">
                  <Utensils className="mr-2 h-4 w-4" /> Request Custom Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Request Custom Food/Remedy</DialogTitle>
                </DialogHeader>
                <PostServiceForm 
                  onSubmit={handlePostCustomOrder} 
                  onCancel={() => setIsPostCustomOrderDialogOpen(false)} 
                  isCustomOrder={true} 
                  categoryOptions={CUSTOM_REQUEST_OPTIONS}
                />
              </DialogContent>
            </Dialog>

            <p className="text-xs text-destructive-foreground mt-4 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Quality assurance and cancellation warnings apply.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Available Offerings</CardTitle>
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
              <div className="grid grid-cols-1 gap-4">
                {postedOfferings.map((offering) => (
                  <FoodOfferingCard key={offering.$id} offering={offering} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No food or wellness offerings posted yet for your college.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Utensils className="h-5 w-5 text-secondary-neon" /> Custom Order Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {renderCustomRequests(postedCustomRequests)}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default FoodWellnessPage;