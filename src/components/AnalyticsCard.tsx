import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Utensils, DollarSign } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTotalUsers } from '@/hooks/useTotalUsers';
import { useFoodOrdersAnalytics } from '@/hooks/useFoodOrdersAnalytics';
import { useTotalTransactions } from '@/hooks/useTotalTransactions';

const AnalyticsCard = () => {
  const { userProfile } = useAuth(); // Use userProfile
  // Determine the collegeName to pass to hooks. If developer, pass undefined to fetch all.
  const collegeNameFilter = userProfile?.isDeveloper ? undefined : userProfile?.collegeName;

  const { totalUsers, isLoading: isLoadingUsers } = useTotalUsers(collegeNameFilter);
  const { foodOrdersLastWeek, isLoading: isLoadingFoodOrders } = useFoodOrdersAnalytics(collegeNameFilter);
  const { totalTransactions, isLoading: isLoadingTransactions } = useTotalTransactions(collegeNameFilter);

  const isLoading = isLoadingUsers || isLoadingFoodOrders || isLoadingTransactions;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm font-medium">Analytics Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading analytics...</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" /> Total Users
              </span>
              <span className="font-bold text-lg">{totalUsers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Utensils className="h-4 w-4" /> Food Orders (Last 7 Days)
              </span>
              <span className="font-bold text-lg">{foodOrdersLastWeek}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" /> Total Transactions
              </span>
              <span className="font-bold text-lg">{totalTransactions}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsCard;