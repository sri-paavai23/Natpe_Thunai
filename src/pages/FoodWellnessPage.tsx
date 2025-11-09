"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Soup, HeartPulse, ShieldCheck, PlusCircle, Utensils } from "lucide-react"; // Added Utensils icon
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostServiceForm from "@/components/forms/PostServiceForm"; // Import the new form

interface ServicePost {
  id: string;
  title: string;
  description: string;
  category: string;
  price: string;
  contact: string;
  datePosted: string;
  customOrderDescription?: string; // New optional field
  isCustomRequest?: boolean; // New field to differentiate custom requests
}

const dummyFoodWellnessOfferings: ServicePost[] = [
  { id: "fw1", title: "Homemade Healthy Lunchboxes", description: "Nutritious and delicious lunchboxes prepared fresh daily. Customizable options available.", category: "Homemade Meals", price: "₹150/meal", contact: "chef@example.com", datePosted: "2024-07-21" },
  { id: "fw2", title: "Herbal Immunity Boosters", description: "Natural herbal remedies to boost your immunity and well-being.", category: "Wellness Remedies", price: "₹200/pack", contact: "herbalist@example.com", datePosted: "2024-07-19" },
];

const dummyCustomRequests: ServicePost[] = [
  { id: "cr1", title: "Vegan Meal Prep Request", description: "Looking for someone to prepare vegan meals for a week.", category: "Homemade Meals", price: "₹1000-₹1500", contact: "veganuser@example.com", datePosted: "2024-07-23", customOrderDescription: "No nuts, gluten-free, high protein. Deliver to hostel room 205.", isCustomRequest: true },
];

const FoodWellnessPage = () => {
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);
  const [isPostCustomOrderDialogOpen, setIsPostCustomOrderDialogOpen] = useState(false); // New state
  const [postedOfferings, setPostedOfferings] = useState<ServicePost[]>(dummyFoodWellnessOfferings);
  const [postedCustomRequests, setPostedCustomRequests] = useState<ServicePost[]>(dummyCustomRequests); // New state

  const handleServiceClick = (serviceName: string) => {
    toast.info(`You selected "${serviceName}". Feature coming soon!`);
  };

  const handlePostService = (data: Omit<ServicePost, "id" | "datePosted">) => {
    const newOffering: ServicePost = {
      ...data,
      id: `fw${postedOfferings.length + 1}`,
      datePosted: new Date().toISOString().split('T')[0],
      isCustomRequest: false,
    };
    setPostedOfferings((prev) => [newOffering, ...prev]);
    toast.success(`Your offering "${newOffering.title}" has been posted!`);
    setIsPostServiceDialogOpen(false);
  };

  const handlePostCustomOrder = (data: Omit<ServicePost, "id" | "datePosted">) => {
    const newRequest: ServicePost = {
      ...data,
      id: `cr${postedCustomRequests.length + 1}`,
      datePosted: new Date().toISOString().split('T')[0],
      isCustomRequest: true,
    };
    setPostedCustomRequests((prev) => [newRequest, ...prev]);
    toast.success(`Your custom order request "${newRequest.title}" has been posted!`);
    setIsPostCustomOrderDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Food & Wellness</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Soup className="h-5 w-5 text-secondary-neon" /> Healthy Options
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Discover homemade food and wellness remedies from trusted campus peers.
            </p>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleServiceClick("Homemade Meals")}
            >
              <Soup className="mr-2 h-4 w-4" /> Homemade Meals
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleServiceClick("Wellness Remedies")}
            >
              <HeartPulse className="mr-2 h-4 w-4" /> Wellness Remedies
            </Button>
            <Dialog open={isPostServiceDialogOpen} onOpenChange={setIsPostServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post Your Offering
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Food/Wellness Offering</DialogTitle>
                </DialogHeader>
                <PostServiceForm onSubmit={handlePostService} onCancel={() => setIsPostServiceDialogOpen(false)} />
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
                <PostServiceForm onSubmit={handlePostCustomOrder} onCancel={() => setIsPostCustomOrderDialogOpen(false)} isCustomOrder={true} />
              </DialogContent>
            </Dialog>

            <p className="text-xs text-destructive-foreground mt-4 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Quality assurance and cancellation warnings apply.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Recently Posted Offerings</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {postedOfferings.length > 0 ? (
              postedOfferings.map((offering) => (
                <div key={offering.id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground">{offering.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{offering.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Category: <span className="font-medium text-foreground">{offering.category}</span></p>
                  <p className="text-xs text-muted-foreground">Price: <span className="font-medium text-foreground">{offering.price}</span></p>
                  <p className="text-xs text-muted-foreground">Contact: <span className="font-medium text-foreground">{offering.contact}</span></p>
                  <p className="text-xs text-muted-foreground">Posted: {offering.datePosted}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No offerings posted yet. Be the first!</p>
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
            {postedCustomRequests.length > 0 ? (
              postedCustomRequests.map((request) => (
                <div key={request.id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground">{request.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
                  {request.customOrderDescription && (
                    <p className="text-xs text-muted-foreground mt-1">Details: <span className="font-medium text-foreground">{request.customOrderDescription}</span></p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Category: <span className="font-medium text-foreground">{request.category}</span></p>
                  <p className="text-xs text-muted-foreground">Budget: <span className="font-medium text-foreground">{request.price}</span></p>
                  <p className="text-xs text-muted-foreground">Contact: <span className="font-medium text-foreground">{request.contact}</span></p>
                  <p className="text-xs text-muted-foreground">Posted: {request.datePosted}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No custom order requests yet. Be the first to request!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default FoodWellnessPage;