"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, ListTodo } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const DailyQuestCard = () => {
  const [isClaiming, setIsClaiming] = useState(false);
  const { userProfile, addXp, updateUserProfile } = useAuth();

  const itemsListedToday = userProfile?.itemsListedToday ?? 0;
  const lastQuestCompletedDate = userProfile?.lastQuestCompletedDate ? new Date(userProfile.lastQuestCompletedDate) : null;

  const today = new Date();
  const isQuestCompletedToday = lastQuestCompletedDate &&
    lastQuestCompletedDate.getDate() === today.getDate() &&
    lastQuestCompletedDate.getMonth() === today.getMonth() &&
    lastQuestCompletedDate.getFullYear() === today.getFullYear();

  const canClaimQuest = itemsListedToday >= 1 && !isQuestCompletedToday;

  const handleClaimQuest = async () => {
    if (!userProfile || !canClaimQuest) return;

    setIsClaiming(true);
    try {
      await addXp(20);
      await updateUserProfile({
        lastQuestCompletedDate: new Date().toISOString(),
        itemsListedToday: 0,
      });
      toast.success("Daily Quest claimed! +20 XP!");
    } catch (error) {
      console.error("Error claiming daily quest:", error);
      toast.error("Failed to claim daily quest.");
    } finally {
      setIsClaiming(false);
    }
  };

  if (!userProfile || userProfile.role === "developer") {
    return null;
  }

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-secondary-neon" /> Daily Quest
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <p className="text-sm text-muted-foreground">
          List at least 1 item in the marketplace to earn 20 XP.
        </p>
        <p className="text-sm text-foreground">
          Items listed today: <span className="font-semibold">{itemsListedToday}/1</span>
        </p>
        {isQuestCompletedToday ? (
          <div className="flex items-center text-green-500 font-medium">
            <CheckCircle className="h-4 w-4 mr-2" /> Quest Completed for Today!
          </div>
        ) : (
          <Button
            onClick={handleClaimQuest}
            disabled={!canClaimQuest || isClaiming}
            className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
          >
            {isClaiming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Claim 20 XP"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyQuestCard;