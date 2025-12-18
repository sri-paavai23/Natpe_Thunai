"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const LoginStreakCard = () => {
  const [isClaiming, setIsClaiming] = useState(false);
  const currentStreak = 3; // Placeholder for user's login streak
  const { addXp } = useAuth(); // Use addXp

  const handleClaimStreak = async () => {
    setIsClaiming(true);
    try {
      await addXp(10 * currentStreak); // Example: 10 XP per streak day
      toast.success(`Claimed ${10 * currentStreak} XP for your ${currentStreak}-day streak!`);
      // In a real app, you'd also update the user's last login date and reset/increment streak
    } catch (error) {
      console.error("Error claiming streak XP:", error);
      toast.error("Failed to claim streak XP.");
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" /> Login Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <p className="text-sm text-muted-foreground">
          You've logged in for <span className="font-semibold text-foreground">{currentStreak} consecutive days!</span>
        </p>
        <p className="text-sm text-foreground">
          Claim <span className="font-semibold text-secondary-neon">{10 * currentStreak} XP</span> for your streak.
        </p>
        <Button
          onClick={handleClaimStreak}
          disabled={isClaiming}
          className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
        >
          {isClaiming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Claim Streak XP"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default LoginStreakCard;