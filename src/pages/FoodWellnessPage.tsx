"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Soup, ShieldCheck, PlusCircle, Utensils, Loader2, MapPin, Star, ChefHat, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useServiceListings } from "@/hooks/useServiceListings";
// IMPORT THE UNIFIED FORM
import PlaceFoodOrderForm from "@/components/forms/PlaceFoodOrderForm"; 
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import FoodCustomRequestsList from "@/components/FoodCustomRequestsList";
import FoodOfferingCard from "@/components/FoodOfferingCard";

const OFFERING_CATEGORIES = ["homemade-meals", "wellness-remedies", "snacks"];

const FoodWellnessPage = () => {
  const { user, userProfile } = useAuth();
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);
  const [isPostCustomOrderDialogOpen, setIsPostCustomOrderDialogOpen] = useState(false);
  
  const { services: allPosts, isLoading, error } = useServiceListings(undefined); 
  const postedOfferings = allPosts.filter(p => !p.isCustomOrder && OFFERING_CATEGORIES.includes(p.category));
  const postedCustomRequests = allPosts.filter(p => p.isCustomOrder);

  const handlePostFoodListing = async (data: any) => {
    if (!user || !userProfile) return;
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID, 
        ID.unique(),
        {
          ...data,
          posterId: user.$id,
          posterName: user.name,
          collegeName: userProfile.collegeName,
        }
      );
      toast.success(data.isCustomOrder ? "Request posted!" : "Menu updated successfully!");
      setIsPostServiceDialogOpen(false);
      setIsPostCustomOrderDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to post.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-24">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-foreground">
              CAMPUS<span className="text-secondary-neon">EATS</span>
            </h1>
            <p className="text-xs text-muted-foreground font-medium">Homemade & Healthy.</p>
          </div>
          <Dialog open={isPostServiceDialogOpen} onOpenChange={setIsPostServiceDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 h-8 text-xs font-bold">
                <ChefHat className="mr-1 h-3 w-3" /> Sell Food
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Start Your Cloud Kitchen</DialogTitle>
                <DialogDescription>List your homemade dishes.</DialogDescription>
              </DialogHeader>
              {/* MODE = SELL */}
              <PlaceFoodOrderForm 
                 mode="sell"
                 onSubmit={handlePostFoodListing} 
                 onCancel={() => setIsPostServiceDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* OFFERINGS GRID */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Soup className="h-5 w-5 text-secondary-neon" /> On The Menu
            </h2>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => <Card key={i} className="h-48 animate-pulse bg-muted/20" />)}
            </div>
          ) : postedOfferings.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {postedOfferings.map(item => (
                <FoodOfferingCard key={item.$id} offering={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground text-sm">No food available. Be the first chef!</p>
            </div>
          )}
        </div>

        {/* CUSTOM REQUESTS */}
        <Card className="bg-secondary/5 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" /> Custom Cravings?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">Request a custom meal.</p>
            <Dialog open={isPostCustomOrderDialogOpen} onOpenChange={setIsPostCustomOrderDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10">
                  <PlusCircle className="mr-2 h-4 w-4" /> Request Custom Dish
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Request Custom Food</DialogTitle>
                    <DialogDescription>Let chefs know what you need.</DialogDescription>
                </DialogHeader>
                {/* MODE = REQUEST */}
                <PlaceFoodOrderForm 
                    mode="request"
                    onSubmit={handlePostFoodListing} 
                    onCancel={() => setIsPostCustomOrderDialogOpen(false)} 
                />
              </DialogContent>
            </Dialog>
            {postedCustomRequests.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <FoodCustomRequestsList requests={postedCustomRequests} isLoading={isLoading} error={error} />
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1 opacity-70">
          <ShieldCheck className="h-3 w-3" /> Natpe Thunai ensures safe peer-to-peer exchange.
        </p>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default FoodWellnessPage;