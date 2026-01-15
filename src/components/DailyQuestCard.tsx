"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollText, Loader2, CheckCircle, Gift } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { isToday } from "date-fns";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";

// --- Configuration: Daily Quest Definitions ---
const DAILY_QUESTS = [
  {
    id: "quest_list_items",
    title: "Market Mogul",
    description: "List 2 items on The Exchange.",
    target: 2,
    xpReward: 50,
    coinsReward: 100,
    type: "itemsListed", 
  },
  {
    id: "quest_login_streak",
    title: "Consistent Earner",
    description: "Log in 3 days in a row.",
    target: 3,
    xpReward: 30,
    coinsReward: 50,
    type: "loginStreak", 
  },
  {
    id: "quest_complete_profile",
    title: "Identity Verified",
    description: "Complete your profile details (Phone & UPI).",
    target: 1, 
    xpReward: 100,
    coinsReward: 200,
    type: "profileCompleted",
  },
];

const DailyQuestCard = () => {
  const [isQuestDialogOpen, setIsQuestDialogOpen] = useState(false);
  const [claimingQuestId, setClaimingQuestId] = useState<string | null>(null);
  
  // FIX 1: Removed checkUserStatus to solve TS error (we rely on addXp to refresh)
  const { userProfile, addXp } = useAuth();

  // --- Helper: Get Progress for a Quest ---
  const getQuestProgress = (questType: string): number => {
    if (!userProfile) return 0;
    
    // FIX 2: Cast userProfile to any to access dynamic properties without TS errors
    const profile = userProfile as any;

    switch (questType) {
      case "itemsListed":
        return profile.itemsListedToday ?? 0;
      case "loginStreak":
        return parseInt(localStorage.getItem("natpe_streak") || "0", 10);
      case "profileCompleted":
        return (profile.mobileNumber && profile.upiId) ? 1 : 0;
      default:
        return 0;
    }
  };

  // --- Helper: Check if a specific quest is already claimed today ---
  const isQuestClaimed = (questId: string): boolean => {
    if (!userProfile) return false;
    
    // FIX 3: Cast to any to access 'claimedQuests'
    const profile = userProfile as any;

    let claimedQuests = profile.claimedQuests || {};
    
    // Handle JSON string if it comes from DB as string
    if (typeof claimedQuests === 'string') {
        try {
            claimedQuests = JSON.parse(claimedQuests);
        } catch (e) {
            claimedQuests = {};
        }
    }
    
    const claimedDateStr = claimedQuests[questId];
    if (!claimedDateStr) return false;
    return isToday(new Date(claimedDateStr));
  };

  // --- Calculate Overall Status ---
  const completedQuestsCount = DAILY_QUESTS.filter(q => {
    const progress = getQuestProgress(q.type);
    const claimed = isQuestClaimed(q.id);
    return progress >= q.target || claimed; 
  }).length;

  const handleViewQuests = () => {
    setIsQuestDialogOpen(true);
  };

  const handleClaimReward = async (quest: typeof DAILY_QUESTS[0]) => {
    if (!userProfile || !userProfile.$id) return;

    setClaimingQuestId(quest.id);
    try {
      // FIX 4: Robust Claim Logic using 'any' casting
      const profile = userProfile as any;
      let currentClaimedQuests = profile.claimedQuests || {};
      
      if (typeof currentClaimedQuests === 'string') {
        try { currentClaimedQuests = JSON.parse(currentClaimedQuests); } catch(e) { currentClaimedQuests = {} }
      }

      const updatedClaimedQuests = {
        ...currentClaimedQuests,
        [quest.id]: new Date().toISOString()
      };

      // 1. Update Database (Mark as Claimed)
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        userProfile.$id,
        {
            claimedQuests: JSON.stringify(updatedClaimedQuests)
        }
      );

      // 2. Add XP (Updates Context & UI)
      if (addXp) {
        await addXp(quest.xpReward);
        toast.success(`Claimed: ${quest.title}! +${quest.xpReward} XP`);
      } else {
        toast.success(`Claimed: ${quest.title}!`);
        // If addXp isn't available, we force a page reload to show new state as fallback
        window.location.reload();
      }

    } catch (error: any) {
      console.error("Error claiming quest:", error);
      toast.error("Failed to claim reward. Please try again.");
    } finally {
      setClaimingQuestId(null);
    }
  };

  return (
    <>
      <Card className="bg-card text-card-foreground shadow-lg border-border">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-secondary-neon" /> Daily Quests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex flex-col items-start">
          <p className="text-sm text-muted-foreground mb-3">
            You have completed <span className="font-bold text-secondary-neon">{completedQuestsCount}/{DAILY_QUESTS.length}</span> quests today.
          </p>
          <Button onClick={handleViewQuests} className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            View All Quests
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isQuestDialogOpen} onOpenChange={setIsQuestDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card text-card-foreground border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Gift className="h-5 w-5 text-secondary-neon" /> Today's Quests
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Complete these tasks to level up faster!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {DAILY_QUESTS.map((quest) => {
              const progress = getQuestProgress(quest.type);
              const isCompleted = progress >= quest.target;
              const isClaimed = isQuestClaimed(quest.id);
              const canClaim = isCompleted && !isClaimed;

              return (
                <div key={quest.id} className="p-3 border border-border rounded-lg bg-background/50 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{quest.title}</h4>
                      <p className="text-xs text-muted-foreground">{quest.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-secondary-neon">+{quest.xpReward} XP</span>
                    </div>
                  </div>

                  {/* Progress Bar Visual */}
                  <div className="w-full bg-secondary/20 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-secondary-neon h-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, (progress / quest.target) * 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-muted-foreground">
                      Progress: {Math.min(progress, quest.target)} / {quest.target}
                    </span>

                    {isClaimed ? (
                      <Button variant="ghost" size="sm" disabled className="text-green-500 hover:text-green-600 h-8">
                        <CheckCircle className="mr-1 h-4 w-4" /> Claimed
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => handleClaimReward(quest)} 
                        disabled={!canClaim || claimingQuestId === quest.id}
                        size="sm"
                        className={`h-8 text-xs ${canClaim ? 'bg-secondary-neon hover:bg-secondary-neon/90' : 'bg-muted text-muted-foreground'}`}
                      >
                        {claimingQuestId === quest.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : canClaim ? (
                          "Claim Reward"
                        ) : (
                          "In Progress"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-end">
             <Button variant="outline" onClick={() => setIsQuestDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DailyQuestCard;