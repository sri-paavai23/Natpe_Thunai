"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Wallet, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { calculateCommissionRate, formatCommissionRate } from "@/utils/commission";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { DEVELOPER_UPI_ID } from "@/lib/config"; // Import DEVELOPER_UPI_ID

const WalletPage = () => {
  const { userProfile } = useAuth();
  const { earnedBalance, spentBalance, isLoading, error } = useWalletBalance();
  
  // Dynamic Commission Calculation
  const userLevel = userProfile?.level ?? 1;
  const dynamicCommissionRateValue = calculateCommissionRate(userLevel);
  const dynamicCommissionRateDisplay = formatCommissionRate(dynamicCommissionRateValue);

  // Dummy data for wallet
  const currentBalance = 1250.75; // This is still dummy, but the request was to make earned/spent functional.

  // Removed handleAddFunds function as it's no longer needed.

  // Removed handleWithdrawFunds function as it's no longer needed.

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Wallet & Payments</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Wallet className="h-5 w-5 text-secondary-neon" /> Your Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading balances...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error: {error}</p>
            ) : (
              <>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <p className="text-lg text-muted-foreground">Total Earned:</p>
                  <p className="text-2xl font-bold text-secondary-neon">₹{earnedBalance.toFixed(2)}</p>
                </div>
                <div className="flex justify-between items-center pt-3">
                  <p className="text-lg text-muted-foreground">Total Spent:</p>
                  <p className="text-2xl font-bold text-destructive">₹{spentBalance.toFixed(2)}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-destructive/10 border-destructive text-destructive-foreground shadow-lg">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-destructive flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-destructive" /> Dynamic Commission Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-gray-800">
              Your current commission rate is <span className="font-bold">{dynamicCommissionRateDisplay}</span> (Level {userLevel}). This rate is applied to all successful transactions facilitated through Natpe🤝Thunai.
            </p>
            <p className="text-xs text-gray-600 mt-2">
              This rate decreases as your user level increases. For full details, please refer to the Dynamic Commission Policy in the Policies section.
            </p>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default WalletPage;