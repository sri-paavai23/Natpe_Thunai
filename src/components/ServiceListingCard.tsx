"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, DollarSign, Star, X, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useServiceReviews } from "@/hooks/useServiceReviews";
import { ServicePost } from "@/hooks/useServiceListings";
import { useBargainRequests } from '@/hooks/useBargainRequests'; // NEW IMPORT
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ServicePaymentDialog from "./forms/ServicePaymentDialog";

interface ServiceListingCardProps {
  service: ServicePost;
  onOpenBargainDialog: (service: ServicePost) => void;
  onOpenReviewDialog: (serviceId: string, sellerId: string, serviceTitle: string) => void;
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
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  
  // NEW: Use Bargain Request Hook
  // We check the status for this specific service ID
  const { sendBargainRequest, getBargainStatusForProduct } = useBargainRequests();
  const { status: currentBargainStatus } = getBargainStatusForProduct(service.$id);

  // Only call useServiceReviews if service.$id is valid
  const { averageRating, isLoading: isReviewsLoading, error: reviewsError, reviews: serviceReviews } = 
    service.$id ? useServiceReviews(service.$id) : { averageRating: 0, isLoading: false, error: null, reviews: [] };
  
  const hasReviewed = false; 

  const handleContactProvider = () => {
    if (!user) {
      toast.error("Please log in to contact the provider.");
      navigate("/auth");
      return;
    }
    if (user.$id === service.posterId) {
      toast.info("You are the provider of this service.");
      return;
    }
    setIsPaymentDialogOpen(true);
  };

  // NEW: Handle Send Bargain Request (Logic adapted from ProductDetailsPage)
  const handleSendBargainRequest = async () => {
    if (!user) {
      toast.error("Please log in to bargain.");
      navigate("/auth");
      return;
    }
    if (user.$id === service.posterId) {
      toast.info("You cannot bargain on your own service.");
      return;
    }

    // Status checks
    if (currentBargainStatus === 'pending') {
      toast.info("You already have a pending bargain request for this service.");
      return;
    }
    if (currentBargainStatus === 'denied') {
      toast.info("Your previous bargain request was denied.");
      return;
    }

    const priceString = service.price.replace(/[₹,]/g, '').split('/')[0].trim();
    const originalAmount = parseFloat(priceString);

    if (isNaN(originalAmount) || originalAmount <= 0) {
      toast.error("Invalid service price for bargaining.");
      return;
    }

    const discountRate = 0.15;
    const requestedBargainAmount = originalAmount * (1 - discountRate);

    try {
      // We adapt the service object to match the expected structure of the hook
      // ensuring we map 'posterId' to 'userId' as expected by the notification system
      const bargainItem = {
        $id: service.$id,
        title: service.title,
        userId: service.posterId, // Map posterId to userId for the hook
        price: service.price,
        imageUrl: "", // Services might not have images, pass empty or service.imageUrl if available
        sellerName: service.posterName // Pass provider name
      };

      await sendBargainRequest(bargainItem as any, requestedBargainAmount);
      // Toast handled in hook
    } catch (error) {
      console.error("Bargain request failed", error);
    }
  };

  const isBargainDisabled = 
    user?.$id === service.posterId || 
    currentBargainStatus === 'pending' || 
    currentBargainStatus === 'denied';

  // Calculate display price for button
  const originalPriceVal = parseFloat(service.price.replace(/[₹,]/g, '').split('/')[0].trim());
  const bargainPriceVal = (originalPriceVal * 0.85).toFixed(2);

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
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleContactProvider}
              disabled={user?.$id === service.posterId}
            >
              Contact Provider
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Pay for Service: {service.title}</DialogTitle>
            </DialogHeader>
            <ServicePaymentDialog
              service={service}
              onPaymentInitiated={() => setIsPaymentDialogOpen(false)}
              onCancel={() => setIsPaymentDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {!isFoodOrWellnessCategory && (
          // NEW: Bargain Button Logic (Request based, not immediate payment)
          <Button
            size="sm"
            variant="outline"
            className="border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10"
            onClick={handleSendBargainRequest}
            disabled={isBargainDisabled}
          >
            {currentBargainStatus === 'pending' ? (
                <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Pending...</>
            ) : currentBargainStatus === 'denied' ? (
                "Bargain Denied"
            ) : (
                <><MessageSquareText className="mr-2 h-4 w-4" /> Bargain (15% off)</>
            )}
          </Button>
        )}
        
        {!hasReviewed && (
          <Button
            size="sm"
            variant="outline"
            className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
            onClick={() => onOpenReviewDialog(service.$id, service.posterId, service.title)}
            disabled={user?.$id === service.posterId}
          >
            <Star className="mr-2 h-4 w-4" /> Leave a Review
          </Button>
        )}
      </div>
    </div>
  );
};

export default ServiceListingCard;