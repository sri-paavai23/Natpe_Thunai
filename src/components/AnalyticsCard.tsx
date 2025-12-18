"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Package, Loader2 } from "lucide-react";
import { useMarketListings } from "@/hooks/useMarketListings"; // Use useMarketListings
import { useAuth } from "@/context/AuthContext";

const AnalyticsCard = () => {
  const { userProfile } = useAuth();
  const { listings, isLoading, error } = useMarketListings(); // Use listings from useMarketListings

  if (!userProfile || userProfile.role === "developer") {
    return null; // Analytics not for developers
  }

  if (isLoading) {
    return (
      <Card className="bg-card text-card-foreground shadow-lg border-border">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
          <p className="ml-2 text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card text-card-foreground shadow-lg border-border">
        <CardContent className="p-4 text-center text-destructive">
          Error loading analytics: {error}
        </CardContent>
      </Card>
    );
  }

  // Filter listings by type for analytics
  const totalListings = listings.length;
  const itemsForSale = listings.filter(item => item.type === "sell").length;
  const itemsForRent = listings.filter(item => item.type === "rent").length;
  const itemsForGift = listings.filter(item => item.type === "gift").length;
  const sportsItems = listings.filter(item => item.type === "sports").length;

  // Placeholder for actual transaction data
  const totalTransactions = 15;
  const activeUsers = 120;

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground">Campus Analytics</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center space-x-3">
          <DollarSign className="h-6 w-6 text-secondary-neon" />
          <div>
            <p className="text-sm text-muted-foreground">Total Transactions</p>
            <p className="text-lg font-bold text-foreground">{totalTransactions}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-secondary-neon" />
          <div>
            <p className="text-sm text-muted-foreground">Active Users</p>
            <p className="text-lg font-bold text-foreground">{activeUsers}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Package className="h-6 w-6 text-secondary-neon" />
          <div>
            <p className="text-sm text-muted-foreground">Total Listings</p>
            <p className="text-lg font-bold text-foreground">{totalListings}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Package className="h-6 w-6 text-secondary-neon" />
          <div>
            <p className="text-sm text-muted-foreground">Items for Sale</p>
            <p className="text-lg font-bold text-foreground">{itemsForSale}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Package className="h-6 w-6 text-secondary-neon" />
          <div>
            <p className="text-sm text-muted-foreground">Items for Rent</p>
            <p className="text-lg font-bold text-foreground">{itemsForRent}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Package className="h-6 w-6 text-secondary-neon" />
          <div>
            <p className="text-sm text-muted-foreground">Items for Gift</p>
            <p className="text-lg font-bold text-foreground">{itemsForGift}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Package className="h-6 w-6 text-secondary-neon" />
          <div>
            <p className="text-sm text-muted-foreground">Sports Items</p>
            <p className="text-lg font-bold text-foreground">{sportsItems}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsCard;