"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useMarketListings, MarketListing } from "@/hooks/useMarketListings";
import MarketProductCard from "@/components/MarketProductCard"; // Assuming this component exists

const MarketTabs = () => {
  const [activeTab, setActiveTab] = useState<MarketListing["type"] | "all">("all");

  const { listings, isLoading, error } = useMarketListings(activeTab === "all" ? undefined : activeTab);

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as MarketListing["type"] | "all")} className="w-full">
      <TabsList className="grid w-full grid-cols-5 bg-muted text-muted-foreground">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="sell">Sell</TabsTrigger>
        <TabsTrigger value="rent">Rent</TabsTrigger>
        <TabsTrigger value="gift">Gift</TabsTrigger>
        <TabsTrigger value="sports">Sports</TabsTrigger>
      </TabsList>
      <TabsContent value={activeTab} className="mt-4">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">
              {activeTab === "all" ? "All Listings" : `Listings for ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
            </CardTitle>
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
                {listings.map((listing) => (
                  <MarketProductCard key={listing.$id} product={listing} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No listings found for this category.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default MarketTabs;