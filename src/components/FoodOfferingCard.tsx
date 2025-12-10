"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, MapPin, DollarSign } from "lucide-react";
import { FoodOffering } from "@/hooks/useFoodOfferings"; // Import FoodOffering type

interface FoodOfferingCardProps {
  offering: FoodOffering;
  onViewDetails: (offering: FoodOffering) => void;
  onPlaceOrder: (offering: FoodOffering) => void;
}

const FoodOfferingCard: React.FC<FoodOfferingCardProps> = ({ offering, onViewDetails, onPlaceOrder }) => {
  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border hover:shadow-xl transition-shadow duration-200">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Utensils className="h-5 w-5 text-secondary-neon" /> {offering.title}
          </CardTitle>
          <CardDescription className="text-secondary-neon font-bold text-md">₹{offering.price.toFixed(2)}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        <p className="text-sm text-muted-foreground">{offering.description}</p>
        <div className="flex items-center text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 mr-1" />
          <span>{offering.collegeName}</span>
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <DollarSign className="h-3 w-3 mr-1" />
          <span>Category: {offering.category}</span>
        </div>
        <div className="flex justify-end gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={() => onViewDetails(offering)} className="border-primary text-primary hover:bg-primary/10">
            View Details
          </Button>
          <Button size="sm" onClick={() => onPlaceOrder(offering)} className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            Order Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FoodOfferingCard;