"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const LoginStreakCard = () => {
  const { addXp, userProfile } = useAuth();
  const [loginStreak, setLoginStreak] = useState(0);
  const [claimedToday, setClaimedToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const initializeStreak = () => {
        // 1. Get Today's Date
        const today = new Date().toDateString(); 
        
        // 2. Retrieve stored data
        const lastLoginDate = localStorage.getItem("natpe_last_login_date");
        const lastClaimDate = localStorage.getItem("natpe_last_claim_date");
        let currentStreak = parseInt(localStorage.getItem("natpe_streak") || "0", 10);

        // 3. Logic to Calculate Streak
        if (lastLoginDate === today) {
            // Already visited today, keep streak
            if (currentStreak === 0) currentStreak = 1;
        } else {
            // First visit today
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toDateString();

            if (lastLoginDate === yesterdayString) {
                currentStreak += 1;
            } else {
                currentStreak = 1; // Streak broken
            }

            // Update storage
            localStorage.setItem("natpe_last_login_date", today);
            localStorage.setItem("natpe_streak", currentStreak.toString());
        }

        // 4. Update State
        setLoginStreak(currentStreak);

        // 5. Check Claim Status
        if (lastClaimDate === today) {
            setClaimedToday(true);
        } else {
            setClaimedToday(false);
        }
        
        setIsLoading(false);
    };

    initializeStreak();
  }, []);

  const handleClaimReward = async (event: React.MouseEvent) => {
    event.stopPropagation(); 

    if (claimedToday) {
      toast.info("Reward already claimed today. Come back tomorrow!");
      return;
    }

    if (!userProfile) {
        toast.error("Please login to claim rewards.");
        return;
    }

    setIsProcessing(true);

    try {
        // LEVELING LOGIC FIX:
        // Cap the reward at 50 XP max. 
        // Early levels (Hook phase) need ~50 XP, so this is a huge reward.
        // Later levels (Grind phase) need ~500 XP, so this is a balanced daily boost.
        const rawReward = 10 * loginStreak;
        const rewardXP = Math.min(rawReward, 50); 

        if (addXp) {
            await addXp(rewardXP);
            
            // Mark as claimed locally
            const today = new Date().toDateString();
            localStorage.setItem("natpe_last_claim_date", today);
            setClaimedToday(true);
            
            toast.success("Streak Reward Claimed!", {
                description: `You earned +${rewardXP} XP for your ${loginStreak}-day streak.`
            });
        }
    } catch (error) {
        toast.error("Failed to claim reward.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleCardClick = () => {
    toast.info(`You are on a ${loginStreak}-day streak! Max daily reward is capped at 50 XP.`);
  };

  if (isLoading) {
      return (
        <Card className="bg-card shadow-lg border-border h-[130px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </Card>
      );
  }

  // Calculate potential reward for display
  const potentialReward = Math.min(10 * loginStreak, 50);

  return (
    <Card 
        className="bg-card text-card-foreground shadow-lg border-border cursor-pointer hover:shadow-xl transition-shadow relative overflow-hidden" 
        onClick={handleCardClick}
    >
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <Flame className={`h-5 w-5 ${claimedToday ? 'text-muted-foreground' : 'text-orange-500 animate-pulse'}`} /> 
          Login Streak
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex flex-col items-start">
        <p className="text-sm text-muted-foreground mb-3">
            You're on a <span className="font-bold text-secondary-neon">{loginStreak}-day</span> streak!
        </p>
        <Button 
          onClick={handleClaimReward} 
          className={`w-full text-primary-foreground transition-all duration-200 font-bold ${
            claimedToday 
                ? "bg-muted hover:bg-muted cursor-not-allowed text-muted-foreground border border-border" 
                : "bg-secondary-neon hover:bg-secondary-neon/90 shadow-md"
          }`}
          disabled={claimedToday || isProcessing}
        >
          {isProcessing ? (
             <Loader2 className="h-4 w-4 animate-spin" />
          ) : claimedToday ? (
            <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Claimed</span>
          ) : (
            `Claim +${potentialReward} XP`
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default LoginStreakCard;