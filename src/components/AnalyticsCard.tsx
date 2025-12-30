"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useTotalUsers } from '@/hooks/useTotalUsers';
import { useMarketListings } from '@/hooks/useMarketListings';
import { useFoodOrdersAnalytics } from '@/hooks/useFoodOrdersAnalytics';
import { useTotalTransactions } from '@/hooks/useTotalTransactions';

const AnalyticsCard = () => {
  const { userProfile } = useAuth(); // NEW: Get userProfile to access collegeName
  // Determine the collegeName to pass to hooks. If developer, pass undefined to fetch all.
  const collegeNameFilter = userProfile?.userType === 'developer' ? undefined : userProfile?.collegeId;

  const { totalUsers, isLoading: isLoadingUsers } = useTotalUsers(collegeNameFilter);
  const { products, isLoading: isLoadingListings } = useMarketListings();
  const { foodOrdersLastWeek, isLoading: isLoadingFoodOrders } = useFoodOrdersAnalytics(collegeNameFilter);
  const { totalTransactions, isLoading: isLoadingTransactions } = useTotalTransactions(collegeNameFilter);

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Overall Analytics</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
          <p className="text-2xl font-bold">{isLoadingUsers ? '...' : totalUsers}</p>
          <p className="text-sm text-muted-foreground">Total Users</p>
        </div>
        <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
          <p className="text-2xl font-bold">{isLoadingListings ? '...' : products.length}</p>
          <p className="text-sm text-muted-foreground">Active Listings</p>
        </div>
        <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
          <p className="text-2xl font-bold">{isLoadingFoodOrders ? '...' : foodOrdersLastWeek}</p>
          <p className="text-sm text-muted-foreground">Food Orders (Last 7 Days)</p>
        </div>
        <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
          <p className="text-2xl font-bold">{isLoadingTransactions ? '...' : totalTransactions}</p>
          <p className="text-sm text-muted-foreground">Total Transactions</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsCard;