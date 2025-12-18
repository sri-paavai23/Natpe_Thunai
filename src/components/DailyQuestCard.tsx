"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollText, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { isToday } from "date-fns";

const DAILY_QUEST_TARGET = 2; // List 2 items
const DAILY_QUEST_XP_REWARD = 50;
const DAILY_QUEST_COINS_REWARD = 100; // Assuming coins are a separate reward

const DailyQuestCard = () => {
  const [isQuestDialogOpen, setIsQuestDialogOpen] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const { userProfile, addXp, updateUserProfile } = useAuth();

  const itemsListedToday = userProfile?.itemsListedToday ?? 0;
  const lastQuestCompletedDate = userProfile?.lastQuestCompletedDate ? new Date(userProfile.lastQuestCompletedDate) : null;

  const isQuestCompleted = itemsListedToday >= DAILY_QUEST_TARGET;
  const isQuestClaimedToday = lastQuestCompletedDate && isToday(lastQuestCompletedDate);
  const canClaimReward = isQuestCompleted && !isQuestClaimedToday; // Corrected variable name

  const handleViewQuest = () => {
    setIsQuestDialogOpen(true);
  };
  
  const handleClaimReward = async () => {
    if (!userProfile || !addXp || !updateUserProfile) {
      toast.error("User profile not loaded or functions unavailable.");
      return;
    }
    if (!canClaimReward) {
      toast.error("Quest not completed or already claimed today.");
      return;
    }

    setIsClaiming(true);
    try {
      await addXp(DAILY_QUEST_XP_REWARD); // Reward XP
      // In a real app, you'd also add coins to a separate balance
      
      // Update user profile to mark quest as claimed today and reset items listed
      await updateUserProfile(userProfile.$id, {
        lastQuestCompletedDate: new Date().toISOString(),
        itemsListedToday: 0, // Reset for the next quest
      });

      toast.success(`Quest completed! +${DAILY_QUEST_XP_REWARD} XP and ${DAILY_QUEST_COINS_REWARD} Coins claimed.`);
      setIsQuestDialogOpen(false);
    } catch (error: any) {
      console.error("Error claiming daily quest reward:", error);
      toast.error(error.message || "Failed to claim reward.");
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <>
      <Card className="bg-card text-card-foreground shadow-lg border-border">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-secondary-neon" /> Daily Quest
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex flex-col items-start">
          <p className="text-sm text-muted-foreground mb-3">Complete a quest today to earn XP and rewards!</p>
          <Button onClick={handleViewQuest} className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            View Quest
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isQuestDialogOpen} onOpenChange={setIsQuestDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Today's Daily Quest</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Here's what you need to do to earn your rewards!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-foreground font-medium">Quest: List {DAILY_QUEST_TARGET} items on The Exchange market.</p>
            <p className="text-sm text-muted-foreground">Reward: +{DAILY_QUEST_XP_REWARD} XP, {DAILY_QUEST_COINS_REWARD} Coins</p>
            <p className="text-sm text-muted-foreground">
              Status: <span className="font-semibold">
                {isQuestClaimedToday ? "Claimed Today!" : (isQuestCompleted ? "Completed!" : `In Progress (${itemsListedToday}/${DAILY_QUEST_TARGET})`)}
              </span>
            </p>
          </div>
          <Button 
            onClick={handleClaimReward} 
            className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
            disabled={!canClaimReward || isClaiming}
          >
            {isClaiming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Claiming...
              </>
            ) : (
              "Claim Reward"
            )}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DailyQuestCard;