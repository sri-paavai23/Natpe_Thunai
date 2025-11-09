"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import ProductListingCard from "@/components/ProductListingCard"; // Import ProductListingCard

// Define MarketTabValue type for consistency
type MarketTabValue = "all" | "buy" | "sell" | "rent" | "gifts" | "sports";

interface Product {
  $id: string; // Changed to $id
  imageUrl: string;
  title: string;
  price: string;
  sellerRating: number;
  sellerBadge?: string;
  type: "sell" | "rent" | "gift" | "sports" | "gift-request";
  description: string;
  damages?: string;
  policies?: string;
  condition?: string;
  sellerId: string; // Added for consistency
  sellerName: string; // Added for consistency
}

interface MarketTabsProps {
  onValueChange: (value: MarketTabValue) => void;
  products: Product[]; // All products
  filteredProducts: Product[]; // Products filtered by the current tab
  activeTab: MarketTabValue; // Pass activeTab to ensure correct initial display
}

const MarketTabs: React.FC<MarketTabsProps> = ({ onValueChange, products, filteredProducts, activeTab }) => {
  const handleTabChange = (value: MarketTabValue) => {
    onValueChange(value); // Propagate the change to parent
    toast.info(`Switched to ${value} market tab.`);
  };

  // Helper to render product cards for a given product array
  const renderProductCards = (items: Product[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.length > 0 ? (
        items.map((product) => (
          <ProductListingCard key={product.$id} {...product} /> // Use $id here
        ))
      ) : (
        <p className="col-span-full text-center text-muted-foreground py-4">No listings found for this category.</p>
      )}
    </div>
  );

  return (
    <Tabs defaultValue={activeTab} className="w-full" onValueChange={handleTabChange}>
      <TabsList className="flex flex-wrap justify-center w-full bg-primary-blue-light text-primary-foreground h-auto p-1">
        <TabsTrigger value="all" className="flex-1 sm:flex-none data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">All Market</TabsTrigger>
        <TabsTrigger value="buy" className="flex-1 sm:flex-none data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Buy</TabsTrigger>
        <TabsTrigger value="sell" className="flex-1 sm:flex-none data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Sell</TabsTrigger>
        <TabsTrigger value="rent" className="flex-1 sm:flex-none data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Rent</TabsTrigger>
        <TabsTrigger value="gifts" className="flex-1 sm:flex-none data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Gifts & Crafts</TabsTrigger>
        <TabsTrigger value="sports" className="flex-1 sm:flex-none data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Sports Gear</TabsTrigger>
      </TabsList>
      <div className="mt-4 space-y-4">
        <TabsContent value="all">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              {renderProductCards(products)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="buy">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              {renderProductCards(filteredProducts.filter(p => p.type === "sell"))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sell">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              {renderProductCards(filteredProducts.filter(p => p.type === "sell"))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="rent">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              {renderProductCards(filteredProducts.filter(p => p.type === "rent"))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="gifts">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              {renderProductCards(filteredProducts.filter(p => p.type === "gift" || p.type === "gift-request"))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sports">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              {renderProductCards(filteredProducts.filter(p => p.type === "sports"))}
            </CardContent>
          </Card>
        </TabsContent>
      </div>
    </Tabs>
  );
};

export default MarketTabs;