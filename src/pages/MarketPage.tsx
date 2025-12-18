"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import MarketListingFormWrapper from "@/components/forms/MarketListingFormWrapper";
import { useMarketListings, MarketListing } from "@/hooks/useMarketListings";
import { useAuth } from "@/context/AuthContext";
import MarketProductCard from "@/components/MarketProductCard";

const MarketPage = () => {
  const { user, userProfile } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<MarketListing["type"] | undefined>(undefined);

  const { listings, isLoading, error } = useMarketListings(activeFilter);

  const isAgeGated = (userProfile?.age ?? 0) >= 25;

  const handleListingPosted = () => {
    setIsDialogOpen(false);
    // Listings will refetch automatically due to realtime subscription in useMarketListings
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Campus Marketplace</h1>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-secondary-neon" /> Post New Listing
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Sell, rent, or gift items to your college peers.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4" disabled={isAgeGated}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Listing
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Marketplace Listing</DialogTitle>
                </DialogHeader>
                <MarketListingFormWrapper
                  onListingPosted={handleListingPosted}
                  onCancel={() => setIsDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
            <p className="text-xs text-destructive-foreground mt-4">
              Note: This section is age-gated for users under 25.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Browse Listings</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant={activeFilter === undefined ? "secondary" : "outline"}
                onClick={() => setActiveFilter(undefined)}
                className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
              >
                All
              </Button>
              <Button
                variant={activeFilter === "sell" ? "secondary" : "outline"}
                onClick={() => setActiveFilter("sell")}
                className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
              >
                Sell
              </Button>
              <Button
                variant={activeFilter === "rent" ? "secondary" : "outline"}
                onClick={() => setActiveFilter("rent")}
                className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
              >
                Rent
              </Button>
              <Button
                variant={activeFilter === "gift" ? "secondary" : "outline"}
                onClick={() => setActiveFilter("gift")}
                className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
              >
                Gift
              </Button>
              <Button
                variant={activeFilter === "sports" ? "secondary" : "outline"}
                onClick={() => setActiveFilter("sports")}
                className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
              >
                Sports
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading listings...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading listings: {error}</p>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {listings.map((listing) => (
                  <MarketProductCard key={listing.$id} product={listing} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No listings found for this category.</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default MarketPage;