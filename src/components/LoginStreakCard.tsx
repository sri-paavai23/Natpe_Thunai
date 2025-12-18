"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext"; // Import useAuth

const LoginStreakCard = () => {
  const currentStreak = 3; // Placeholder for user's login streak
  const { addXp } = useAuth(); // Use addXp

  const handleClaimReward = () => {
    addXp(10 * currentStreak); // Reward XP based on streak length
    toast.success(`You claimed your ${currentStreak}-day streak reward! +${10 * currentStreak} XP earned.`);
    // In a real app, trigger a reward claim process and update streak/rewards
  };

  const handleCardClick = () => {
    toast.info(`You are currently on a ${currentStreak}-day login streak! Keep it up for more rewards.`);
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border cursor-pointer hover:shadow-xl transition-shadow" onClick={handleCardClick}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <Flame className="h-5 w-5 text-secondary-neon" /> Login Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex flex-col items-start">
        <p className="text-sm text-muted-foreground mb-3">You're on a <span className="font-bold text-secondary-neon">{currentStreak}-day</span> streak!</p>
        <Button onClick={handleClaimReward} className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          Claim Reward
        </Button>
      </CardContent>
    </Card>
  );
};

export default LoginStreakCard;