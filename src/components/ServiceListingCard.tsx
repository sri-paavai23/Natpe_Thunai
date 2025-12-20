"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquareText, DollarSign, Star, X } from "lucide-react"; // Added X icon
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useServiceReviews } from "@/hooks/useServiceReviews";
import { ServicePost } from "@/hooks/useServiceListings";
import { cn } from "@/lib/utils";

interface ServiceListingCardProps {
  service: ServicePost;
  onOpenBargainDialog: (service: ServicePost) => void;
  onOpenReviewDialog: (service: ServicePost) => void;
  isFoodOrWellnessCategory: boolean;
}

// Helper function to format category slug into readable title
const formatCategoryTitle = (categorySlug: string | undefined) => {
  if (!categorySlug || categorySlug === "all") return "All Service Listings";
  return categorySlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const ServiceListingCard: React.FC<ServiceListingCardProps> = ({
  service,
  onOpenBargainDialog,
  onOpenReviewDialog,
  isFoodOrWellnessCategory,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Only call useServiceReviews if service.$id is valid
  const { averageRating, isLoading: isReviewsLoading, error: reviewsError, reviews: serviceReviews } = 
    service.$id ? useServiceReviews(service.$id) : { averageRating: 0, isLoading: false, error: null, reviews: [] };
  
  const hasReviewed = false; // Simulate: In a real app, check if user has already reviewed this service

  const handleContactProvider = (contact: string, title: string) => {
    toast.info(`Contacting provider for "${title}" at ${contact}.`);
    // In a real app, this would open a chat or email client.
  };

  return (
    <div key={service.$id} className="p-3 border border-border rounded-md bg-background flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <div>
        <h3 className="font-semibold text-foreground">{service.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
        <p className="text-xs text-muted-foreground mt-1">Price: <span className="font-medium text-secondary-neon">{service.price}</span></p>
        <p className="text-xs text-muted-foreground">Posted by: {service.posterName}</p>
        <p className="text-xs text-muted-foreground">Posted: {new Date(service.$createdAt).toLocaleDateString()}</p>
        
        <div className="flex items-center gap-2 mt-2">
          {service.category && (
            <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
              {formatCategoryTitle(service.category)}
            </Badge>
          )}
          {service.isCustomOrder && (
            <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
              Custom Request
            </Badge>
          )}
        </div>

        <div className="flex items-center text-sm text-muted-foreground mt-2">
          {isReviewsLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1 text-secondary-neon" />
          ) : reviewsError ? (
            <span className="text-destructive flex items-center gap-1"><X className="h-4 w-4" /> Error loading rating</span>
          ) : (
            <>
              <Star className={cn("h-4 w-4 mr-1", averageRating > 0 ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground")} />
              <span className="font-medium text-foreground">{averageRating.toFixed(1)}</span>
              <span className="ml-1">({serviceReviews.length} reviews)</span>
            </>
          )}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0">
        <Button 
          size="sm" 
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => handleContactProvider(service.contact, service.title)}
        >
          Contact Provider
        </Button>
        {!isFoodOrWellnessCategory && (
          <Button
            size="sm"
            variant="outline"
            className="border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10"
            onClick={() => onOpenBargainDialog(service)}
          >
            <DollarSign className="mr-2 h-4 w-4" /> Bargain (15% off)
          </Button>
        )}
        {!hasReviewed && (
          <Button
            size="sm"
            variant="outline"
            className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
            onClick={() => onOpenReviewDialog(service)}
          >
            <Star className="mr-2 h-4 w-4" /> Leave a Review
          </Button>
        )}
      </div>
    </div>
  );
};

export default ServiceListingCard;