"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useMarketListings } from "@/hooks/useMarketListings";
import MarketProductCard from "@/components/MarketProductCard"; // Assuming this component exists

const DiscoveryFeed = () => {
  const { listings, isLoading, error } = useMarketListings(); // Fetches all types by default

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground">Discover New Listings</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
            <p className="ml-3 text-muted-foreground">Loading listings...</p>
          </div>
        ) : error ? (
          <p className="text-center text-destructive py-4">Error loading listings: {error}</p>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {listings.map((product) => ( // Changed from 'product' to 'listing' for consistency, but kept 'product' for MarketProductCard prop
              <MarketProductCard key={product.$id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">No listings found for your college.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscoveryFeed;