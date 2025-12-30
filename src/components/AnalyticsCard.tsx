import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/context/AuthContext';
import { useTotalUsers } from '@/hooks/useTotalUsers';
import { useTotalTransactions } from '@/hooks/useTotalTransactions';
import { useFoodOrdersAnalytics } from '@/hooks/useFoodOrdersAnalytics';
import { Loader2 } from 'lucide-react';

interface AnalyticsCardProps {
  title: string;
  value: number | string;
  description: string;
  isLoading: boolean;
}

const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ title, value, description, isLoading }) => (
  <Card className="bg-card border-border-dark text-foreground">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary-blue" /> : value}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

const AnalyticsDashboard: React.FC = () => {
  const { userProfile, loading: isAuthLoading } = useAuth(); // Corrected 'isLoading' to 'loading'

  // Determine the collegeName to pass to hooks. If developer, pass undefined to fetch all.
  const collegeNameFilter = userProfile?.role === 'developer' ? undefined : userProfile?.collegeName; // Corrected userType to role, added collegeName

  const { totalUsers, isLoading: isUsersLoading } = useTotalUsers(collegeNameFilter);
  const { totalTransactions, isLoading: isTransactionsLoading } = useTotalTransactions(collegeNameFilter);
  const { foodOrdersLastWeek, isLoading: isFoodOrdersLoading } = useFoodOrdersAnalytics(collegeNameFilter);

  const isLoadingAny = isAuthLoading || isUsersLoading || isTransactionsLoading || isFoodOrdersLoading;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <AnalyticsCard
        title="Total Users"
        value={totalUsers}
        description="Users registered in your college"
        isLoading={isLoadingAny}
      />
      <AnalyticsCard
        title="Total Transactions"
        value={totalTransactions}
        description="Marketplace transactions in your college"
        isLoading={isLoadingAny}
      />
      <AnalyticsCard
        title="Food Orders (Last 7 Days)"
        value={foodOrdersLastWeek}
        description="Food orders placed in your college"
        isLoading={isLoadingAny}
      />
    </div>
  );
};

export default AnalyticsDashboard;