"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext"; // Import useAuth

const LoginStreakCard = () => {
  const { addXp } = useAuth();
  const [loginStreak, setLoginStreak] = useState(0); // Initialize loginStreak to 0
  const [claimedToday, setClaimedToday] = useState(false);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date to start of day

    const lastLoginDateStr = localStorage.getItem("lastLoginDate");
    const lastClaimDateStr = localStorage.getItem("lastLoginStreakClaimDate");
    const storedStreak = parseInt(localStorage.getItem("loginStreak") || "0", 10);

    let newStreak = storedStreak;

    if (lastLoginDateStr) {
      const lastLoginDate = new Date(lastLoginDateStr);
      lastLoginDate.setHours(0, 0, 0, 0); // Normalize last login date to start of day

      const diffTime = Math.abs(today.getTime() - lastLoginDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // User logged in yesterday, increment streak
        newStreak = storedStreak + 1;
      } else if (diffDays > 1) {
        // Gap in logins, reset streak
        newStreak = 1;
      } else {
        // Logged in today already, keep current streak
        newStreak = storedStreak;
      }
    } else {
      // First login, start streak at 1
      newStreak = 1;
    }

    setLoginStreak(newStreak);
    localStorage.setItem("loginStreak", newStreak.toString());
    localStorage.setItem("lastLoginDate", today.toISOString());

    // Check if reward was claimed today
    if (lastClaimDateStr === today.toISOString().slice(0, 10)) {
      setClaimedToday(true);
    } else {
      setClaimedToday(false);
    }
  }, []);

  const handleClaimReward = (event: React.MouseEvent) => {
    event.stopPropagation();

    if (claimedToday) {
      toast.info("You've already claimed your reward for today! Come back tomorrow.");
      return;
    }

    addXp(10 * loginStreak);
    toast.success(`You claimed your ${loginStreak}-day streak reward! +${10 * loginStreak} XP earned.`);
    
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem("lastLoginStreakClaimDate", today);
    setClaimedToday(true);
  };

  const handleCardClick = () => {
    toast.info(`You are currently on a ${loginStreak}-day login streak! Keep it up for more rewards.`);
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border cursor-pointer hover:shadow-xl transition-shadow" onClick={handleCardClick}>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <Flame className="h-5 w-5 text-secondary-neon" /> Login Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex flex-col items-start">
        <p className="text-sm text-muted-foreground mb-3">You're on a <span className="font-bold text-secondary-neon">{loginStreak}-day</span> streak!</p>
        <Button 
          onClick={handleClaimReward} 
          className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
          disabled={claimedToday || loginStreak === 0}
        >
          {claimedToday ? "Claimed Today" : "Claim Reward"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default LoginStreakCard;