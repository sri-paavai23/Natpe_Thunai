"use client";

import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, Plus } from "lucide-react";
import { ServicePost } from "@/hooks/useServiceListings";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PlaceFoodOrderForm from "./forms/PlaceFoodOrderForm"; // Ensure this path is correct based on your folder structure

interface FoodOfferingCardProps {
  offering: ServicePost;
}

const FoodOfferingCard: React.FC<FoodOfferingCardProps> = ({ offering }) => {
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  // 1. Generate Image (Mock logic using Unsplash based on category)
  // We use the offering ID as a seed so the image stays consistent for this item
  const isMeal = offering.category === "homemade-meals";
  const imageKeyword = isMeal ? "meal" : "drink";
  const imageUrl = `https://source.unsplash.com/400x300/?food,${imageKeyword}&sig=${offering.$id}`;

  // 2. Veg/Non-Veg Logic (Simple keyword check)
  const lowerTitle = offering.title.toLowerCase();
  const isNonVeg = lowerTitle.includes("chicken") || lowerTitle.includes("fish") || lowerTitle.includes("egg") || lowerTitle.includes("mutton");

  return (
    <Card className="group flex flex-col h-full relative overflow-hidden hover:shadow-xl transition-all duration-300 bg-card border-border/60">
      
      {/* --- IMAGE HEADER --- */}
      <div className="relative h-48 w-full bg-muted overflow-hidden">
        <img 
          src={imageUrl} 
          alt={offering.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'; }}
        />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm hover:bg-background">
                {isMeal ? 'Home Cooked' : 'Wellness'}
            </Badge>
        </div>

        {/* Rating/Time Badge (Mock) */}
        <div className="absolute bottom-3 right-3 flex gap-2">
             <Badge className="bg-white/90 text-black backdrop-blur-md px-1.5 py-0.5 h-6 flex items-center gap-1 text-[10px] font-bold border-0">
                <Clock className="h-3 w-3" /> 20m
            </Badge>
            <Badge className="bg-green-600 text-white px-1.5 py-0.5 h-6 flex items-center gap-1 text-[10px] font-bold border-0">
                4.5 <Star className="h-3 w-3 fill-white" />
            </Badge>
        </div>
      </div>

      {/* --- CONTENT SECTION --- */}
      <CardContent className="flex-grow p-4 space-y-3">
        
        {/* Title Row */}
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-lg font-bold leading-tight line-clamp-1 text-foreground group-hover:text-secondary-neon transition-colors">
            {offering.title}
          </h3>
          
          {/* Veg/Non-Veg Icon */}
          <div className={`flex-shrink-0 h-4 w-4 border-[1px] flex items-center justify-center mt-1 ${isNonVeg ? 'border-red-500' : 'border-green-500'}`}>
             <div className={`h-2 w-2 rounded-full ${isNonVeg ? 'bg-red-500' : 'bg-green-500'}`} />
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {offering.description}
        </p>

        {/* Chef Info */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
            <Avatar className="h-6 w-6 border border-border">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${offering.posterName}`} />
                <AvatarFallback>{offering.posterName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-foreground/80 truncate">
                Chef {offering.posterName}
            </span>
        </div>
      </CardContent>

      {/* --- FOOTER ACTION --- */}
      <CardFooter className="p-4 pt-0 mt-auto flex items-center justify-between">
        <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Price</span>
            <span className="text-lg font-black text-foreground">{offering.price}</span>
        </div>

        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 h-10 px-6 font-bold shadow-md transition-transform active:scale-95">
              Add <Plus className="ml-1 h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                Order: {offering.title}
              </DialogTitle>
            </DialogHeader>
            <PlaceFoodOrderForm 
              offering={offering}
              onOrderPlaced={() => setIsOrderDialogOpen(false)}
              onCancel={() => setIsOrderDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default FoodOfferingCard;