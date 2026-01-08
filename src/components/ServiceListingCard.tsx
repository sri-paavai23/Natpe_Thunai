"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Star, X, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useServiceReviews } from "@/hooks/useServiceReviews";
import { ServicePost } from "@/hooks/useServiceListings";
import { useBargainRequests } from '@/hooks/useBargainRequests';
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ServicePaymentDialog from "./forms/ServicePaymentDialog";

interface ServiceListingCardProps {
  service: ServicePost;
  onOpenBargainDialog: (service: ServicePost) => void;
  onOpenReviewDialog: (serviceId: string, sellerId: string, serviceTitle: string) => void;
  isFoodOrWellnessCategory: boolean;
}

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
  
  // Bargain Request Hook
  const { sendBargainRequest, getBargainStatusForProduct } = useBargainRequests();
  const { status: currentBargainStatus } = getBargainStatusForProduct(service.$id);

  const { averageRating, isLoading: isReviewsLoading, error: reviewsError, reviews: serviceReviews } = 
    service.$id ? useServiceReviews(service.$id) : { averageRating: 0, isLoading: false, error: null, reviews: [] };
  
  const hasReviewed = false; 

  // Price Calculation Logic
  const isBargainAccepted = currentBargainStatus === 'accepted';
  const originalPriceVal = parseFloat(service.price.replace(/[₹,]/g, '').split('/')[0].trim());
  const bargainPriceVal = (originalPriceVal * 0.85).toFixed(2);

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

    if (currentBargainStatus === 'pending') {
      toast.info("You already have a pending bargain request.");
      return;
    }
    if (currentBargainStatus === 'denied') {
      toast.info("Your previous bargain request was denied.");
      return;
    }
    if (isBargainAccepted) {
        toast.info("Bargain already accepted! Proceed to contact provider.");
        return;
    }

    if (isNaN(originalPriceVal) || originalPriceVal <= 0) {
      toast.error("Invalid service price for bargaining.");
      return;
    }

    const discountRate = 0.15;
    const requestedBargainAmount = originalPriceVal * (1 - discountRate);

    try {
      const bargainItem = {
        $id: service.$id,
        title: service.title,
        userId: service.posterId, 
        price: service.price,
        imageUrl: "", 
        sellerName: service.posterName 
      };

      await sendBargainRequest(bargainItem as any, requestedBargainAmount);
    } catch (error) {
      console.error("Bargain request failed", error);
    }
  };

  const isBargainDisabled = 
    user?.$id === service.posterId || 
    currentBargainStatus === 'pending' || 
    currentBargainStatus === 'denied';

  return (
    <div key={service.$id} className="p-3 border border-border rounded-md bg-background flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <div>
        <h3 className="font-semibold text-foreground">{service.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
        
        {/* UPDATED PRICE DISPLAY LOGIC */}
        <div className="mt-1">
            {isBargainAccepted ? (
                <p className="text-xs flex items-center gap-2">
                    <span className="text-muted-foreground line-through decoration-destructive">{service.price}</span>
                    <span className="font-bold text-green-500 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                        ₹{bargainPriceVal}
                    </span>
                    <span className="text-[10px] text-green-600 font-medium">(Bargain Accepted)</span>
                </p>
            ) : (
                <p className="text-xs text-muted-foreground">Price: <span className="font-medium text-secondary-neon">{service.price}</span></p>
            )}
        </div>

        <p className="text-xs text-muted-foreground mt-1">Posted by: {service.posterName}</p>
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
              className={cn(
                  "text-primary-foreground hover:bg-primary/90 transition-all",
                  isBargainAccepted ? "bg-green-600 hover:bg-green-700 ring-2 ring-green-400 ring-offset-1" : "bg-primary"
              )}
              onClick={handleContactProvider}
              disabled={user?.$id === service.posterId}
            >
              {isBargainAccepted ? "Pay Now (Discounted)" : "Contact Provider"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Pay for Service: {service.title}</DialogTitle>
            </DialogHeader>
            <ServicePaymentDialog
              // Pass the modified service object if bargain accepted to ensure payment dialog sees the lower price
              service={isBargainAccepted ? { ...service, price: bargainPriceVal } : service}
              onPaymentInitiated={() => setIsPaymentDialogOpen(false)}
              onCancel={() => setIsPaymentDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Hide Bargain Button if Accepted */}
        {!isFoodOrWellnessCategory && !isBargainAccepted && (
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