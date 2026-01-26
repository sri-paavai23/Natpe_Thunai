"use client";

import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, Flame, ArrowRight, User } from "lucide-react";
import { ServicePost } from "@/hooks/useServiceListings";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PlaceFoodOrderForm from "./forms/PlaceFoodOrderForm"; 
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext"; // Import Auth Context

interface FoodOfferingCardProps {
  offering: ServicePost;
}

interface FoodServicePost extends ServicePost {
  dietaryType?: string;
  timeEstimate?: string;
}

const FoodOfferingCard: React.FC<FoodOfferingCardProps> = ({ offering }) => {
  const { user } = useAuth(); // Get current user
  const navigate = useNavigate();
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const foodItem = offering as FoodServicePost;

  // Logic
  const isMeal = foodItem.category === "homemade-meals";
  const imageKeyword = isMeal ? "curry" : "tea";
  const imageUrl = `https://source.unsplash.com/400x300/?food,${imageKeyword}&sig=${foodItem.$id}`;
  
  const isNonVeg = 
      foodItem.dietaryType === 'non-veg' || 
      foodItem.title.toLowerCase().includes("chicken");

  const prepTime = foodItem.timeEstimate || "20-30 min";
  
  // FIX: Check if current user is the poster
  const isOwner = user?.$id === foodItem.posterId;

  const handleOrderSuccess = () => {
    setIsOrderDialogOpen(false);
    toast.success("Order Locked! Redirecting to tracking log...");
    navigate("/tracking");
  };

  return (
    <Card className="group flex flex-col h-full relative overflow-hidden border-border/60 hover:shadow-[0_8px_30px_rgba(0,243,255,0.1)] transition-all duration-300 bg-card rounded-2xl">
      
      {/* Image Header */}
      <div className="relative h-44 w-full bg-muted overflow-hidden">
        <img 
          src={imageUrl} 
          alt={foodItem.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60" />
        
        <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-foreground shadow-sm border-0">
                {isMeal ? 'HOME COOKED' : 'WELLNESS'}
            </Badge>
        </div>

        <div className="absolute top-3 right-3">
             <Badge className={`border-0 text-[10px] font-black uppercase px-2 py-0.5 shadow-sm ${isNonVeg ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                {isNonVeg ? "Non-Veg" : "Veg"}
             </Badge>
        </div>

        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
            <Badge className="bg-black/60 text-white backdrop-blur-md px-1.5 py-0.5 h-5 flex items-center gap-1 text-[10px] font-bold border-0">
                <Clock className="h-3 w-3" /> {prepTime}
            </Badge>
            <Badge className="bg-green-600 text-white px-1.5 py-0.5 h-5 flex items-center gap-1 text-[10px] font-black border-0 shadow-lg">
                4.5 <Star className="h-3 w-3 fill-white" />
            </Badge>
        </div>
      </div>

      <CardContent className="flex-grow p-4 space-y-2">
        <h3 className="text-lg font-black leading-tight line-clamp-1 text-foreground group-hover:text-secondary-neon transition-colors italic uppercase tracking-tighter">
            {foodItem.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed h-8 font-medium">
          {foodItem.description}
        </p>
        
        <div className="flex items-center gap-2 pt-3 border-t border-border/40 mt-2">
            <Avatar className="h-6 w-6 border border-border">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${foodItem.posterName}`} />
                <AvatarFallback className="text-[9px] font-bold">{foodItem.posterName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-tight">
                Chef {foodItem.posterName}
            </span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 mt-auto flex items-center justify-between gap-4">
        <div className="flex flex-col">
            <span className="text-xl font-black text-secondary-neon">₹{foodItem.price}</span>
            <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter -mt-1">per plate</span>
        </div>

        {/* FIX: Prevent owner from buying own food */}
        {isOwner ? (
            <Button size="sm" variant="secondary" disabled className="h-10 px-6 font-bold text-xs opacity-70">
                <User className="mr-2 h-4 w-4" /> Your Listing
            </Button>
        ) : (
            <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 h-10 px-6 font-black uppercase text-xs shadow-neon transition-all active:scale-95 rounded-xl">
                  GET FOOD <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95%] sm:max-w-[425px] bg-card text-card-foreground border-border rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 font-black italic text-xl">
                      <Flame className="h-6 w-6 text-orange-500 fill-orange-500" /> ORDER SUMMARY
                  </DialogTitle>
                </DialogHeader>
                
                <PlaceFoodOrderForm 
                  mode="buy"
                  offering={foodItem}
                  onOrderPlaced={handleOrderSuccess} 
                  onCancel={() => setIsOrderDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
        )}
      </CardFooter>
    </Card>
  );
};

export default FoodOfferingCard;