import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWalletBalance } from '@/hooks/useWalletBalance'; // Assuming this hook exists
import { toast } from 'sonner';

const WalletPage = () => {
  const { userProfile } = useAuth();
  const { earnedBalance, spentBalance, isLoading, error } = useWalletBalance();

  if (isLoading) {
    return <div className="text-center py-8">Loading wallet data...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  const currentBalance = earnedBalance - spentBalance;

  const handleWithdraw = () => {
    toast.message("Withdrawal functionality coming soon!");
  };

  const handleDeposit = () => {
    toast.message("Deposit functionality coming soon!");
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-foreground">My Wallet</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{currentBalance.toFixed(2)}</div>
            <p className="text-xs">Available funds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{earnedBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{spentBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Lifetime expenditures</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-foreground">Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Recent transactions will be displayed here.</p>
          {/* Placeholder for transaction list */}
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Food Order #1234</span>
              <span className="text-red-500">- ₹150.00</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Daily Quest Reward</span>
              <span className="text-green-500">+ ₹10.00</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Service Payment #5678</span>
              <span className="text-red-500">- ₹500.00</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-foreground">Manage Funds</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleDeposit} className="flex-1">
            <DollarSign className="h-4 w-4 mr-2" /> Deposit Funds
          </Button>
          <Button onClick={handleWithdraw} variant="outline" className="flex-1">
            <Wallet className="h-4 w-4 mr-2" /> Withdraw Funds
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletPage;