"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import ProductListingCard from "@/components/ProductListingCard";
import ServiceListingCard from "@/components/ServiceListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ChevronLeft, ChevronRight, Compass, Inbox } from "lucide-react";
import { useMarketListings } from '@/hooks/useMarketListings';
import { useServiceListings } from '@/hooks/useServiceListings';
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 6; 

const DiscoveryFeed: React.FC = () => {
  const { userProfile } = useAuth();
  
  // 1. Fetch both Products and Services
  const { products, isLoading: productsLoading, error: productsError } = useMarketListings();
  const { services, isLoading: servicesLoading, error: servicesError } = useServiceListings(undefined);

  // State for Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // 2. Combine and Sort Data (Memoized for performance)
  const combinedFeed = useMemo(() => {
    const taggedProducts = products.map(p => ({ ...p, feedType: 'product' }));
    const taggedServices = services.map(s => ({ ...s, feedType: 'service' }));

    const allItems = [...taggedProducts, ...taggedServices];

    // Sort by creation date (Newest first)
    return allItems.sort((a: any, b: any) => 
      new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
    );
  }, [products, services]);

  const isLoading = productsLoading || servicesLoading;
  const error = productsError || servicesError;

  // 3. Calculate Pagination
  const totalPages = Math.ceil(combinedFeed.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = combinedFeed.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      document.getElementById('discovery-feed-top')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      document.getElementById('discovery-feed-top')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
           <Compass className="h-6 w-6 text-secondary-neon" /> Discovery Feed
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-lg bg-muted/20" />
            ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Feed</AlertTitle>
          <AlertDescription>Failed to load listings: {error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (combinedFeed.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
           <Compass className="h-6 w-6 text-secondary-neon" /> Discovery Feed
        </h2>
        <div className="text-center py-12 bg-card border border-dashed border-border rounded-xl">
            <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No Listings Yet</h3>
            <p className="text-muted-foreground mt-1">Be the first to post a product or service!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4" id="discovery-feed-top">
      {/* Title */}
      <div className="flex items-center gap-2 mb-2">
        <Compass className="h-6 w-6 text-secondary-neon" />
        <h2 className="text-2xl font-bold text-foreground">Discovery Feed</h2>
      </div>

      {/* Feed Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {currentItems.map((item: any) => (
          <div key={item.$id} className="h-full w-full animate-in fade-in zoom-in duration-500"> 
            {item.feedType === 'product' ? (
              <ProductListingCard
                product={item}
              />
            ) : (
              <ServiceListingCard
                service={item}
                // These props are placeholders if not using direct interaction in the feed
                // The actual logic lives inside the Service Details or specific Service Page
                isFoodOrWellnessCategory={['homemade-meals', 'wellness-remedies'].includes(item.category)}
                onOpenBargainDialog={() => {}} 
                onOpenReviewDialog={() => {}}
              />
            )}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 pb-4">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentPage === 1}
            className="flex items-center gap-1 border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          
          <span className="text-sm font-medium text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default DiscoveryFeed;