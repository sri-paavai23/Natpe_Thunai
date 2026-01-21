"use client";

import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, Plus, Flame } from "lucide-react";
import { ServicePost } from "@/hooks/useServiceListings";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PlaceFoodOrderForm from "./forms/PlaceFoodOrderForm"; 
import { useNavigate } from "react-router-dom";

interface FoodOfferingCardProps {
  offering: ServicePost;
}

interface FoodServicePost extends ServicePost {
  dietaryType?: string;
  timeEstimate?: string;
}

const FoodOfferingCard: React.FC<FoodOfferingCardProps> = ({ offering }) => {
  const navigate = useNavigate();
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const foodItem = offering as FoodServicePost;

  // Visual Logic
  const isMeal = foodItem.category === "homemade-meals";
  const imageKeyword = isMeal ? "curry" : "tea";
  const imageUrl = `https://source.unsplash.com/400x300/?food,${imageKeyword}&sig=${foodItem.$id}`;
  
  const isNonVeg = 
     foodItem.dietaryType === 'non-veg' || 
     foodItem.title.toLowerCase().includes("chicken");

  const prepTime = foodItem.timeEstimate || "20-30 min";

  /**
   * ESCROW REDIRECTION LOGIC
   * This is triggered after the PlaceFoodOrderForm successfully 
   * creates a document in the Appwrite Food Orders collection.
   */
  const handleOrderSuccess = (orderData: { transactionId: string; totalAmount: number }) => {
    setIsOrderDialogOpen(false);

    // Construct query parameters for the new Escrow Gateway
    const queryParams = new URLSearchParams({
      amount: orderData.totalAmount.toString(),
      txnId: orderData.transactionId,
      title: foodItem.title
    }).toString();

    // Redirect to the bug-free payment page
    navigate(`/escrow-payment?${queryParams}`);
  };

  return (
    <Card className="group flex flex-col h-full relative overflow-hidden hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 bg-card border-border/50 rounded-xl">
      
      {/* Image Header */}
      <div className="relative h-44 w-full bg-muted overflow-hidden">
        <img 
          src={imageUrl} 
          alt={foodItem.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
        <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm">
                {isMeal ? 'Home Cooked' : 'Wellness'}
            </Badge>
        </div>
        <div className="absolute top-3 right-3">
             <Badge className={`border-0 text-[10px] font-bold px-2 py-0.5 shadow-sm ${isNonVeg ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                {isNonVeg ? "Non-Veg" : "Veg"}
             </Badge>
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
            <Badge className="bg-black/60 text-white backdrop-blur-md px-1.5 py-0.5 h-5 flex items-center gap-1 text-[10px] border-0">
                <Clock className="h-3 w-3" /> {prepTime}
            </Badge>
            <Badge className="bg-green-600 text-white px-1.5 py-0.5 h-5 flex items-center gap-1 text-[10px] font-bold border-0">
                4.5 <Star className="h-3 w-3 fill-white" />
            </Badge>
        </div>
      </div>

      <CardContent className="flex-grow p-3 space-y-2">
        <h3 className="text-base font-bold leading-tight line-clamp-1 text-foreground group-hover:text-secondary-neon transition-colors">
            {foodItem.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed h-8">
          {foodItem.description}
        </p>
        <div className="flex items-center gap-2 pt-2 border-t border-dashed border-border/60">
            <Avatar className="h-5 w-5 border border-border">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${foodItem.posterName}`} />
                <AvatarFallback className="text-[9px]">{foodItem.posterName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-foreground/80 truncate">
                By {foodItem.posterName}
            </span>
        </div>
      </CardContent>

      <CardFooter className="p-3 pt-0 mt-auto flex items-center justify-between">
        <div className="flex flex-col">
            <span className="text-lg font-black text-foreground">{foodItem.price}</span>
            <span className="text-[9px] text-muted-foreground -mt-1">per serving</span>
        </div>

        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 h-9 px-4 font-bold shadow-md transition-transform active:scale-95">
              Add <Plus className="ml-1 h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                 <Flame className="h-5 w-5 text-orange-500" /> Order Details
              </DialogTitle>
            </DialogHeader>
            <PlaceFoodOrderForm 
              mode="buy"
              offering={foodItem}
              onOrderPlaced={(data) => handleOrderSuccess(data)}
              onCancel={() => setIsOrderDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default FoodOfferingCard;