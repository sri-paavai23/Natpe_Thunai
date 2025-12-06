"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Wallet, Banknote, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { calculateCommissionRate, formatCommissionRate } from "@/utils/commission";

const WalletPage = () => {
  const { userProfile } = useAuth();
  
  // Dynamic Commission Calculation
  const userLevel = userProfile?.level ?? 1;
  const dynamicCommissionRateValue = calculateCommissionRate(userLevel);
  const dynamicCommissionRateDisplay = formatCommissionRate(dynamicCommissionRateValue);

  // Dummy data for wallet
  const currentBalance = 1250.75;
  const developerUpiId = "8903480105@superyes";

  const handleAddFunds = () => {
    const addFundsAmount = 500; // Example fixed amount for adding funds
    const transactionNote = "Add funds to Natpe Thunai wallet";
    const upiDeepLink = `upi://pay?pa=${developerUpiId}&pn=NatpeThunaiDevelopers&am=${addFundsAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

    window.open(upiDeepLink, "_blank");
    toast.info(`Redirecting to your banking app to add ₹${addFundsAmount.toFixed(2)} to your wallet. Please complete the payment.`);
  };

  const handleWithdrawFunds = () => {
    if (currentBalance <= 0) {
      toast.error("Your wallet balance is zero. Cannot withdraw funds.");
      return;
    }
    const transactionNote = "Withdraw funds from Natpe Thunai wallet";
    const upiDeepLink = `upi://pay?pa=${developerUpiId}&pn=NatpeThunaiDevelopers&am=${currentBalance.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

    window.open(upiDeepLink, "_blank");
    toast.info(`Redirecting to your banking app to withdraw ₹${currentBalance.toFixed(2)}. Developers will process your withdrawal after deducting any applicable fees.`);
  };

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
            <div className="flex justify-between items-center border-b border-border pb-3">
              <p className="text-lg text-muted-foreground">Current Balance:</p>
              <p className="text-2xl font-bold text-secondary-neon">₹{currentBalance.toFixed(2)}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button onClick={handleAddFunds} className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Banknote className="mr-2 h-4 w-4" /> Add Funds
              </Button>
              <Button onClick={handleWithdrawFunds} variant="outline" className="border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10">
                <DollarSign className="mr-2 h-4 w-4" /> Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Removed the "Payment Methods" card as requested */}

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