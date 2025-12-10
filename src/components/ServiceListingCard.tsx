"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, DollarSign, MessageSquareText, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ServicePost } from "@/hooks/useServiceListings"; // Import ServicePost
import { getLevelBadge } from "@/utils/badges"; // Assuming this utility exists

interface ServiceListingCardProps {
  service: ServicePost;
  onViewDetails: (service: ServicePost) => void;
  onBargain: (service: ServicePost) => void;
  sellerLevel?: number; // Optional prop for seller's level
}

const ServiceListingCard: React.FC<ServiceListingCardProps> = ({ service, onViewDetails, onBargain, sellerLevel }) => {
  const sellerBadge = sellerLevel ? getLevelBadge(sellerLevel) : undefined;

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border hover:shadow-xl transition-shadow duration-200">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-secondary-neon" /> {service.title}
          </CardTitle>
          <CardDescription className="text-secondary-neon font-bold text-md">{service.compensation}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        <p className="text-sm text-muted-foreground">{service.description}</p>
        <p className="text-xs text-muted-foreground mt-1">Category: <span className="font-medium text-foreground">{service.category}</span></p>
        <p className="text-xs text-muted-foreground mt-1">Price: <span className="font-medium text-secondary-neon">{service.price}</span></p> {/* Correctly access service.price */}
        <p className="text-xs text-muted-foreground">Posted by: {service.posterName}</p>
        <div className="flex items-center text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 mr-1" />
          <span>{service.collegeName}</span>
        </div>
        {sellerBadge && (
          <Badge className="bg-blue-500 text-white flex items-center gap-1">
            <Award className="h-3 w-3" /> {sellerBadge}
          </Badge>
        )}
        <div className="flex justify-end gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={() => onBargain(service)} className="border-primary text-primary hover:bg-primary/10">
            <MessageSquareText className="h-3 w-3 mr-1" /> Bargain
          </Button>
          <Button size="sm" onClick={() => onViewDetails(service)} className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ServiceListingCard;