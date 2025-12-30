import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { Loader2, Trophy, CheckCircle } from 'lucide-react';
import { isToday, parseISO } from 'date-fns';
import { toast } from 'sonner';

const DailyQuestCard: React.FC = () => {
  const { user, userProfile, loading, addXp, updateUserProfile } = useAuth();

  const itemsListedToday = userProfile?.itemsListedToday ?? 0; // Corrected property access
  const lastQuestCompletedDate = userProfile?.lastQuestCompletedDate ? parseISO(userProfile.lastQuestCompletedDate) : null; // Corrected property access

  const isQuestCompletedToday = lastQuestCompletedDate ? isToday(lastQuestCompletedDate) : false;
  const canClaimReward = itemsListedToday >= 1 && !isQuestCompletedToday;

  const handleClaimReward = async () => {
    if (!userProfile || !user) {
      toast.error("You must be logged in to claim rewards.");
      return;
    }

    if (!canClaimReward) {
      toast.info("You haven't completed the daily quest yet or already claimed it today.");
      return;
    }

    try {
      await addXp(20); // Reward 20 XP for completing the daily quest
      // Update user profile to mark quest as claimed today and reset items listed
      await updateUserProfile({ // Corrected call signature
        lastQuestCompletedDate: new Date().toISOString(),
        itemsListedToday: 0, // Reset for the next day
      });
      toast.success("Daily quest reward claimed! +20 XP!");
    } catch (error) {
      console.error("Error claiming daily quest reward:", error);
      toast.error("Failed to claim daily quest reward.");
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-border-dark text-foreground">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Daily Quest</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return null; // Or a message indicating login is required
  }

  return (
    <Card className="bg-card border-border-dark text-foreground">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <Trophy className="h-5 w-5 mr-2 text-secondary-neon" /> Daily Quest
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          List at least one item in the marketplace to earn 20 XP.
        </p>
        <p className="text-sm">
          Items listed today: <span className="font-bold text-primary-blue-light">{itemsListedToday}</span>
        </p>
        {isQuestCompletedToday ? (
          <div className="flex items-center text-green-500">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Quest completed for today!</span>
          </div>
        ) : (
          <Button
            onClick={handleClaimReward}
            disabled={!canClaimReward}
            className="w-full bg-secondary-neon hover:bg-secondary-neon-dark text-primary-blue"
          >
            {canClaimReward ? 'Claim Reward' : 'Complete Quest to Claim'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyQuestCard;