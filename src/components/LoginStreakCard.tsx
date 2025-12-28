"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext"; // Import useAuth

const LoginStreakCard = () => {
  const currentStreak = 3; // Placeholder for user's login streak
  const { addXp } = useAuth(); // Use addXp
  const [claimedToday, setClaimedToday] = useState(false); // State to track if reward has been claimed today

  useEffect(() => {
    // Check localStorage on component mount to see if the reward was claimed today
    const lastClaimDate = localStorage.getItem("lastLoginStreakClaimDate");
    const today = new Date().toISOString().slice(0, 10); // Get current date in YYYY-MM-DD format

    if (lastClaimDate === today) {
      setClaimedToday(true);
    } else {
      setClaimedToday(false);
    }
  }, []);

  const handleClaimReward = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent the card's onClick from firing when the button is clicked

    if (claimedToday) {
      toast.info("You've already claimed your reward for today! Come back tomorrow.");
      return;
    }

    addXp(10 * currentStreak); // Reward XP based on streak length
    toast.success(`You claimed your ${currentStreak}-day streak reward! +${10 * currentStreak} XP earned.`);
    
    // Store the current date in localStorage to mark the reward as claimed for today
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("lastLoginStreakClaimDate", today);
    setClaimedToday(true);
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
        <Button 
          onClick={handleClaimReward} 
          className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
          disabled={claimedToday} // Disable the button if the reward has been claimed today
        >
          {claimedToday ? "Claimed Today" : "Claim Reward"} {/* Change button text based on claim status */}
        </Button>
      </CardContent>
    </Card>
  );
};

export default LoginStreakCard;