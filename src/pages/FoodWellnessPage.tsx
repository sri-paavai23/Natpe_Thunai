"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Soup, ShieldCheck, PlusCircle, Utensils, Loader2, 
  MapPin, Star, ChefHat, Minus, Plus, ShoppingBag 
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useServiceListings } from "@/hooks/useServiceListings";
// --- UPDATED IMPORTS ---
import PostFoodListingForm from "@/components/forms/PostFoodListingForm"; // New Form
import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID, APPWRITE_SERVICES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import FoodCustomRequestsList from "@/components/FoodCustomRequestsList";

// --- CONFIGURATION ---
const OFFERING_CATEGORIES = ["homemade-meals", "wellness-remedies", "snacks"];

// --- FOOD ITEM CARD COMPONENT ---
const FoodItemCard = ({ item, onOrder }: { item: any, onOrder: (item: any) => void }) => {
  const seed = item.$id; 
  const imageUrl = `https://source.unsplash.com/400x300/?food,${item.category === 'homemade-meals' ? 'curry' : 'tea'}&sig=${seed}`;

  return (
    <Card className="group overflow-hidden border-border/60 hover:shadow-lg transition-all duration-300 bg-card flex flex-col h-full">
      {/* Image Header */}
      <div className="relative h-40 w-full bg-muted overflow-hidden">
        <img 
          src={imageUrl} 
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'; }}
        />
        <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm">
          {item.category === 'homemade-meals' ? 'Home Cooked' : 'Wellness'}
        </div>
        {/* Diet Badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold shadow-sm flex items-center gap-1 ${item.dietaryType === 'non-veg' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
           {item.dietaryType === 'non-veg' ? 'Non-Veg' : 'Veg'}
        </div>
      </div>

      <CardContent className="p-4 flex-grow space-y-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-lg leading-tight line-clamp-1">{item.title}</h3>
        </div>
        
        <p className="text-xs text-muted-foreground line-clamp-2">
          {item.description}
        </p>
        
        {/* Prep Time Badge */}
        {item.timeEstimate && (
            <div className="inline-flex items-center text-[10px] bg-secondary/10 px-1.5 py-0.5 rounded text-secondary-neon">
                <span className="mr-1">🕒</span> {item.timeEstimate}
            </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t border-border/30">
          <Avatar className="h-5 w-5">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.posterName}`} />
            <AvatarFallback>CH</AvatarFallback>
          </Avatar>
          <span className="truncate">Chef {item.posterName}</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between mt-auto">
        <div>
          <p className="text-lg font-bold text-foreground">{item.price}</p>
          <p className="text-[10px] text-muted-foreground">per serving</p>
        </div>
        <Button 
          onClick={() => onOrder(item)} 
          className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 h-9 px-6 font-semibold shadow-md"
        >
          Add
        </Button>
      </CardFooter>
    </Card>
  );
};

// --- MAIN PAGE COMPONENT ---
const FoodWellnessPage = () => {
  const { user, userProfile } = useAuth();
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);
  const [isPostCustomOrderDialogOpen, setIsPostCustomOrderDialogOpen] = useState(false);
  
  // Order Flow States
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderLocation, setOrderLocation] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);

  // Fetch Data
  const { services: allPosts, isLoading, error } = useServiceListings(undefined); 
  const postedOfferings = allPosts.filter(p => !p.isCustomOrder && OFFERING_CATEGORIES.includes(p.category));
  const postedCustomRequests = allPosts.filter(p => p.isCustomOrder);

  // --- HANDLERS ---

  const handleOpenOrderDialog = (item: any) => {
    if (!user) {
      toast.error("Please login to order food.");
      return;
    }
    if (user.$id === item.posterId) {
      toast.error("You cannot order your own item.");
      return;
    }
    setSelectedItem(item);
    setOrderQuantity(1);
    setOrderLocation(""); 
    setOrderNotes("");
    setIsOrderDialogOpen(true);
  };

  const handleConfirmOrder = async () => {
    if (!orderLocation.trim()) {
      toast.error("Please enter a delivery location.");
      return;
    }

    setIsOrdering(true);
    try {
      const priceString = selectedItem.price.toString(); 
      const priceNumber = parseInt(priceString.replace(/[^0-9]/g, ''));
      const totalPrice = priceNumber * orderQuantity;

      // 1. Create Order
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        ID.unique(),
        {
          providerId: selectedItem.posterId,
          providerName: selectedItem.posterName,
          buyerId: user!.$id,
          buyerName: user!.name,
          offeringTitle: selectedItem.title,
          quantity: orderQuantity,
          totalAmount: isNaN(totalPrice) ? 0 : totalPrice,
          status: "Pending Confirmation",
          deliveryLocation: orderLocation,
          notes: orderNotes,
          collegeName: userProfile?.collegeName,
        }
      );

      toast.success("Order placed! Track status in your Activity tab.");
      setIsOrderDialogOpen(false);
    } catch (error: any) {
      console.error("Order failed:", error);
      toast.error("Failed to place order.");
    } finally {
      setIsOrdering(false);
    }
  };

  // Logic to post a listing (Selling Food)
  const handlePostFoodListing = async (data: any) => {
    if (!user || !userProfile) return;
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID, // Stored in services so it shows in feed
        ID.unique(),
        {
          ...data,
          posterId: user.$id,
          posterName: user.name,
          collegeName: userProfile.collegeName,
          // 'isCustomOrder' comes from the form data
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
        
        {/* HEADER SECTION */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter text-foreground">
              CAMPUS<span className="text-secondary-neon">EATS</span>
            </h1>
            <p className="text-xs text-muted-foreground font-medium">Homemade & Healthy, delivered to your block.</p>
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
                <DialogDescription>List your homemade dishes for today.</DialogDescription>
              </DialogHeader>
              
              {/* Using the New Context-Aware Form */}
              <PostFoodListingForm 
                 onSubmit={handlePostFoodListing} 
                 onCancel={() => setIsPostServiceDialogOpen(false)} 
                 isCustomRequest={false} // Mode: Selling
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
                <FoodItemCard key={item.$id} item={item} onOrder={handleOpenOrderDialog} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground text-sm">No food available right now. Be the first chef!</p>
            </div>
          )}
        </div>

        {/* CUSTOM REQUESTS SECTION */}
        <Card className="bg-secondary/5 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" /> Custom Cravings?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Craving something specific? Request a custom meal or wellness remedy.
            </p>
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
                
                {/* Using the New Context-Aware Form */}
                <PostFoodListingForm 
                    onSubmit={handlePostFoodListing} 
                    onCancel={() => setIsPostCustomOrderDialogOpen(false)} 
                    isCustomRequest={true} // Mode: Requesting
                />

              </DialogContent>
            </Dialog>
            
            {postedCustomRequests.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <h3 className="text-xs font-bold uppercase text-muted-foreground mb-3">Recent Requests</h3>
                <FoodCustomRequestsList requests={postedCustomRequests} isLoading={isLoading} error={error} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* SAFETY FOOTER */}
        <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1 opacity-70">
          <ShieldCheck className="h-3 w-3" /> 
          Natpe Thunai ensures safe peer-to-peer food exchange.
        </p>
      </div>

      {/* --- ORDER CONFIRMATION SHEET --- */}
      <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShoppingBag className="h-5 w-5 text-secondary-neon" /> Confirm Order
            </DialogTitle>
            <DialogDescription>
              Ordering from <span className="font-semibold text-foreground">{selectedItem?.posterName}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg">
              <div>
                <p className="font-bold text-foreground">{selectedItem?.title}</p>
                <p className="text-xs text-muted-foreground">₹{selectedItem?.price} x {orderQuantity}</p>
              </div>
              <div className="flex items-center gap-3 bg-background border border-border rounded-md px-2 py-1">
                <button 
                  onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-bold text-sm w-4 text-center">{orderQuantity}</span>
                <button 
                  onClick={() => setOrderQuantity(orderQuantity + 1)}
                  className="text-secondary-neon hover:text-secondary-neon/80"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="location" className="text-xs font-semibold uppercase text-muted-foreground">Delivery Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="location" 
                    placeholder="e.g. Block A, Room 302" 
                    className="pl-9 bg-input/50"
                    value={orderLocation}
                    onChange={(e) => setOrderLocation(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="notes" className="text-xs font-semibold uppercase text-muted-foreground">Cooking Instructions</Label>
                <Textarea 
                  id="notes" 
                  placeholder="e.g. Less spicy, extra sauce..." 
                  className="resize-none h-20 bg-input/50 text-sm"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="font-bold text-lg">Total Pay</span>
              <span className="font-black text-2xl text-secondary-neon">
                ₹{(parseInt(selectedItem?.price?.replace(/[^0-9]/g, '') || '0') * orderQuantity).toFixed(0)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 h-12 text-lg font-bold shadow-lg"
              onClick={handleConfirmOrder}
              disabled={isOrdering}
            >
              {isOrdering ? <Loader2 className="h-5 w-5 animate-spin" /> : "Place Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MadeWithDyad />
    </div>
  );
};

export default FoodWellnessPage;