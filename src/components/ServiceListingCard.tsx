"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Loader2, Star, MessageSquareText, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useServiceReviews } from "@/hooks/useServiceReviews";
import { ServicePost } from "@/hooks/useServiceListings";
import { useBargainRequests } from '@/hooks/useBargainRequests';
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ServicePaymentDialog from "./forms/ServicePaymentDialog"; // Ensure path is correct

interface ServiceListingCardProps {
  service: ServicePost;
  onOpenBargainDialog: (service: ServicePost) => void;
  onOpenReviewDialog: (serviceId: string, sellerId: string, serviceTitle: string) => void;
  isFoodOrWellnessCategory: boolean;
}

// --- HELPER: Category Color Mapping ---
const getCategoryStyle = (cat: string) => {
  if (!cat) return "bg-gray-100 text-gray-800";
  if (cat.includes('tech')) return "bg-slate-100 text-slate-800 border-slate-200";
  if (cat.includes('design')) return "bg-pink-50 text-pink-700 border-pink-200";
  if (cat.includes('academic')) return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-secondary/10 text-secondary-foreground border-secondary/20";
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
  
  // Bargain Logic
  const { sendBargainRequest, getBargainStatusForProduct } = useBargainRequests();
  const { status: currentBargainStatus } = getBargainStatusForProduct(service.$id);

  // Reviews
  const { averageRating, isLoading: isReviewsLoading, error: reviewsError, reviews: serviceReviews } = 
    service.$id ? useServiceReviews(service.$id) : { averageRating: 0, isLoading: false, error: null, reviews: [] };
  
  const hasReviewed = false; // logic placeholder

  // Price Logic
  const isBargainAccepted = currentBargainStatus === 'accepted';
  const originalPriceVal = parseFloat(service.price.replace(/[₹,]/g, '').split('/')[0].trim());
  const bargainPriceVal = (originalPriceVal * 0.85).toFixed(2);
  const displayPrice = isBargainAccepted ? bargainPriceVal : service.price;

  const handleContactProvider = () => {
    if (!user) {
      toast.error("Login required.");
      navigate("/auth");
      return;
    }
    if (user.$id === service.posterId) {
      toast.info("This is your own listing.");
      return;
    }
    setIsPaymentDialogOpen(true);
  };

  const handleSendBargainRequest = async () => {
    if (!user) { toast.error("Login to bargain."); return; }
    if (user.$id === service.posterId) { toast.error("Cannot bargain with yourself."); return; }
    
    if (isNaN(originalPriceVal) || originalPriceVal <= 0) {
      toast.error("Price invalid for bargaining.");
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

  const isOwner = user?.$id === service.posterId;

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-border/60 hover:border-secondary-neon/30 bg-card flex flex-col h-full">
      
      {/* --- HEADER --- */}
      <CardHeader className="p-4 pb-2 space-y-2">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className={cn("capitalize text-[10px] font-bold tracking-wider", getCategoryStyle(service.category))}>
            {service.category.replace(/-/g, ' ')}
          </Badge>
          
          {/* Rating Badge */}
          <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/20 px-1.5 py-0.5 rounded text-xs font-bold text-yellow-600 dark:text-yellow-400 border border-yellow-200/50">
             <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 mr-1" />
             {isReviewsLoading ? "..." : averageRating.toFixed(1)}
             <span className="text-[10px] text-muted-foreground ml-1 font-normal">({serviceReviews.length})</span>
          </div>
        </div>

        <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-secondary-neon transition-colors">
          {service.title}
        </h3>
      </CardHeader>

      {/* --- CONTENT --- */}
      <CardContent className="p-4 pt-0 flex-grow space-y-3">
        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
          {service.description}
        </p>

        {/* Provider Info */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
          <Avatar className="h-6 w-6 border border-border">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${service.posterName}`} />
            <AvatarFallback>{service.posterName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
             <span className="text-xs font-medium text-foreground/90 truncate max-w-[150px]">
               {service.posterName}
             </span>
             {/* Verified Badge (Mock) */}
             <div className="flex items-center text-[10px] text-green-600 dark:text-green-400 gap-0.5">
                <ShieldCheck className="h-3 w-3" /> Verified Student
             </div>
          </div>
        </div>
      </CardContent>

      {/* --- FOOTER (Price & Actions) --- */}
      <CardFooter className="p-3 bg-muted/20 border-t border-border/40 flex flex-col gap-3">
        
        {/* Price Row */}
        <div className="w-full flex justify-between items-center">
           <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Starting At</span>
              <div className="flex items-baseline gap-2">
                 <span className={cn("text-lg font-black", isBargainAccepted ? "text-green-600" : "text-foreground")}>
                    ₹{displayPrice}
                 </span>
                 {isBargainAccepted && (
                    <span className="text-xs text-muted-foreground line-through decoration-destructive">
                       {service.price}
                    </span>
                 )}
              </div>
           </div>
           
           {/* Review Button (Only visible if not owner) */}
           {!isOwner && !hasReviewed && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-yellow-500"
                onClick={() => onOpenReviewDialog(service.$id, service.posterId, service.title)}
                title="Leave a Review"
              >
                 <Star className="h-4 w-4" />
              </Button>
           )}
        </div>

        {/* Action Buttons Row */}
        <div className="w-full grid grid-cols-5 gap-2">
           {/* Bargain Button (2 cols) - Hidden if accepted */}
           {!isFoodOrWellnessCategory && !isBargainAccepted && !isOwner && (
              <Button
                variant="outline"
                size="sm"
                className={cn(
                    "col-span-2 text-xs font-semibold h-9 border-dashed",
                    currentBargainStatus === 'pending' ? "bg-amber-50 text-amber-600 border-amber-200" : 
                    currentBargainStatus === 'denied' ? "bg-red-50 text-red-600 border-red-200 opacity-70" :
                    "border-secondary-neon/50 text-secondary-neon hover:bg-secondary-neon/10"
                )}
                onClick={handleSendBargainRequest}
                disabled={currentBargainStatus === 'pending' || currentBargainStatus === 'denied'}
              >
                 {currentBargainStatus === 'pending' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                 ) : currentBargainStatus === 'denied' ? (
                    <AlertCircle className="h-3 w-3 mr-1" />
                 ) : (
                    <MessageSquareText className="h-3 w-3 mr-1" />
                 )}
                 {currentBargainStatus === 'pending' ? "Wait" : currentBargainStatus === 'denied' ? "Denied" : "Bargain"}
              </Button>
           )}

           {/* Main Action Button (Fills remaining space) */}
           <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
              <DialogTrigger asChild>
                 <Button 
                   className={cn(
                       "h-9 font-bold text-xs shadow-sm transition-transform active:scale-95",
                       isFoodOrWellnessCategory || isBargainAccepted || isOwner 
                          ? "col-span-5" // Full width if bargain hidden
                          : "col-span-3",
                       isBargainAccepted 
                          ? "bg-green-600 hover:bg-green-700 text-white" 
                          : "bg-primary text-primary-foreground hover:bg-primary/90"
                   )}
                   onClick={handleContactProvider}
                   disabled={isOwner}
                 >
                    {isOwner ? "Your Listing" : isBargainAccepted ? (
                       <><CheckCircle2 className="h-3 w-3 mr-1" /> Pay Now</>
                    ) : (
                       "Hire / Connect"
                    )}
                 </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                 <DialogHeader><DialogTitle>Pay for Service</DialogTitle></DialogHeader>
                 <ServicePaymentDialog
                    service={isBargainAccepted ? { ...service, price: bargainPriceVal } : service}
                    onPaymentInitiated={() => setIsPaymentDialogOpen(false)}
                    onCancel={() => setIsPaymentDialogOpen(false)}
                 />
              </DialogContent>
           </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ServiceListingCard;