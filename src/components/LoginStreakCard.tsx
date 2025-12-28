import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Flame, Gift } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner'; // Ensure sonner is imported

const LoginStreakCard: React.FC = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const lastClaimDate = userProfile?.lastLoginStreakClaim;
  const today = new Date().toISOString().split('T')[0];
  const claimedToday = lastClaimDate === today;

  const handleClaimStreak = async () => {
    if (!userProfile || !updateUserProfile) {
      toast.error("User not logged in or profile update function not available.");
      return;
    }

    if (claimedToday) {
      toast.message("You've already claimed your streak reward today!"); // Changed from toast.info
      return;
    }

    try {
      await updateUserProfile({ lastLoginStreakClaim: today });
      toast.success("Login streak reward claimed! You earned 5 points.");
      // Logic to add points would go here
    } catch (error) {
      toast.error("Failed to claim streak reward.");
      console.error("Error claiming streak reward:", error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Login Streak</CardTitle>
        <Flame className="h-4 w-4 text-orange-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">Claim Daily Reward</div>
        <p className="text-xs text-muted-foreground mb-4">
          {claimedToday ? "Reward claimed for today!" : "Log in daily to maintain your streak and earn rewards."}
        </p>
        <Button
          onClick={handleClaimStreak}
          disabled={claimedToday}
          className="w-full"
        >
          {claimedToday ? "Claimed" : "Claim Reward"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default LoginStreakCard;