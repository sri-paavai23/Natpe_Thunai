"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, Users, Utensils } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useMarketListings } from '@/hooks/useMarketListings'; // Import existing hook
import { useTotalUsers } from '@/hooks/useTotalUsers'; // NEW IMPORT
import { useFoodOrdersAnalytics } from '@/hooks/useFoodOrdersAnalytics'; // NEW IMPORT
import { useTotalTransactions } from '@/hooks/useTotalTransactions'; // NEW IMPORT
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for loading states

const AnalyticsCard = () => {
  const { products, isLoading: isLoadingListings, error: listingsError } = useMarketListings();
  const { totalUsers, isLoading: isLoadingUsers, error: usersError } = useTotalUsers();
  const { foodOrdersLastWeek, isLoading: isLoadingFoodOrders, error: foodOrdersError } = useFoodOrdersAnalytics();
  const { totalTransactions, isLoading: isLoadingTransactions, error: transactionsError } = useTotalTransactions();

  const isLoadingAny = isLoadingListings || isLoadingUsers || isLoadingFoodOrders || isLoadingTransactions;
  const hasError = listingsError || usersError || foodOrdersError || transactionsError;

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-secondary-neon" /> Campus Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground mb-3">Real-time insights into campus activity.</p>
        {hasError ? (
          <div className="text-center text-destructive py-4">
            <p>Error loading analytics data.</p>
            <p className="text-xs">{listingsError || usersError || foodOrdersError || transactionsError}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 p-2 border border-border rounded-md bg-background">
              <div className="flex items-center text-sm font-medium text-foreground">
                <Package className="h-4 w-4 mr-2 text-blue-500" /> Listings
              </div>
              {isLoadingAny ? <Skeleton className="h-6 w-1/2 mt-1" /> : <p className="text-2xl font-bold text-secondary-neon">{products.length}</p>}
              <p className="text-xs text-muted-foreground">Total Exchange Items</p>
            </div>
            <div className="space-y-1 p-2 border border-border rounded-md bg-background">
              <div className="flex items-center text-sm font-medium text-foreground">
                <Users className="h-4 w-4 mr-2 text-purple-500" /> Users
              </div>
              {isLoadingAny ? <Skeleton className="h-6 w-1/2 mt-1" /> : <p className="text-2xl font-bold text-secondary-neon">{totalUsers}</p>}
              <p className="text-xs text-muted-foreground">Total Registered</p>
            </div>
            <div className="space-y-1 p-2 border border-border rounded-md bg-background">
              <div className="flex items-center text-sm font-medium text-foreground">
                <Utensils className="h-4 w-4 mr-2 text-red-500" /> Food Orders
              </div>
              {isLoadingAny ? <Skeleton className="h-6 w-1/2 mt-1" /> : <p className="text-2xl font-bold text-secondary-neon">{foodOrdersLastWeek}</p>}
              <p className="text-xs text-muted-foreground">Last 7 Days</p>
            </div>
            <div className="space-y-1 p-2 border border-border rounded-md bg-background">
              <div className="flex items-center text-sm font-medium text-foreground">
                <TrendingUp className="h-4 w-4 mr-2 text-green-500" /> Transactions
              </div>
              {isLoadingAny ? <Skeleton className="h-6 w-1/2 mt-1" /> : <p className="text-2xl font-bold text-secondary-neon">{totalTransactions}</p>}
              <p className="text-xs text-muted-foreground">Total Completed</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsCard;