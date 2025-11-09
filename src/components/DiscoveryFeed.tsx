"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ProductListingCard from "@/components/ProductListingCard"; // Import ProductListingCard
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import { dummyProducts } from "@/pages/MarketPage"; // Import dummyProducts from MarketPage

// Define a type for the listings to ensure all required ProductListingCard props are present
interface DiscoveryListing {
  $id: string;
  title: string;
  price: string;
  imageUrl: string;
  category?: string; // Made optional as it's not always present in Product type
  sellerRating: number;
  sellerBadge?: string;
  type: "sell" | "rent" | "gift" | "sports" | "gift-request";
  description: string;
  sellerId: string;
  sellerName: string;
}

const DiscoveryFeed = () => {
  const navigate = useNavigate();
  // Use a subset of dummyProducts for initial display
  const [listings, setListings] = useState<DiscoveryListing[]>(dummyProducts.slice(0, 4));
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true); // Assume there's more to load initially
  const { userProfile } = useAuth();
  const isDeveloper = userProfile?.role === "developer";

  const handleViewDetails = (listingId: string) => {
    toast.info(`Viewing details for listing ${listingId}`);
    navigate(`/market/product/${listingId}`);
  };

  const handleViewAllFeed = () => {
    navigate("/market");
    toast.info("Navigating to the full Discovery Feed!");
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      // Load the rest of the dummy products
      const remainingProducts = dummyProducts.slice(listings.length);
      setListings((prevListings) => [...prevListings, ...remainingProducts]);
      setHasMore(false); // After loading all dummy products, there are no more
      setLoadingMore(false);
      toast.success("More listings loaded!");
    }, 1000);
  };

  const handleDeveloperDelete = (productId: string) => {
    toast.info(`Developer delete action for product ID: ${productId} (simulated from Discovery Feed)`);
    setListings(prev => prev.filter(item => item.$id !== productId));
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground cursor-pointer hover:text-secondary-neon transition-colors" onClick={handleViewAllFeed}>
          Discovery Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground mb-3">New, trending, top-rated listings.</p>
        <ScrollArea className="w-full whitespace-nowrap rounded-md border border-border p-2">
          <div className="flex w-max space-x-4 pb-2">
            {listings.map((listing) => (
              <div key={listing.$id} className="w-[150px] flex-shrink-0">
                <ProductListingCard
                  $id={listing.$id}
                  imageUrl={listing.imageUrl}
                  title={listing.title}
                  price={listing.price}
                  sellerRating={listing.sellerRating}
                  sellerBadge={listing.sellerBadge}
                  type={listing.type}
                  description={listing.description}
                  sellerId={listing.sellerId}
                  sellerName={listing.sellerName}
                  onDeveloperDelete={isDeveloper ? handleDeveloperDelete : undefined}
                />
              </div>
            ))}
            {hasMore && (
              <div className="w-[150px] flex-shrink-0 flex items-center justify-center">
                <Button
                  variant="outline"
                  className="border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Load More
                </Button>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DiscoveryFeed;