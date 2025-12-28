import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner'; // Ensure sonner is imported

const DailyQuestCard: React.FC = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const questCompletedToday = userProfile?.dailyQuestCompleted === new Date().toISOString().split('T')[0];

  const handleCompleteQuest = async () => {
    if (!userProfile || !updateUserProfile) {
      toast.error("User not logged in or profile update function not available.");
      return;
    }

    if (questCompletedToday) {
      toast.message("You've already completed today's quest!"); // Changed from toast.info
      return;
    }

    try {
      await updateUserProfile({ dailyQuestCompleted: new Date().toISOString().split('T')[0] });
      toast.success("Daily quest completed! You earned 10 points.");
      // Logic to add points would go here
    } catch (error) {
      toast.error("Failed to complete daily quest.");
      console.error("Error completing daily quest:", error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Daily Quest</CardTitle>
        {questCompletedToday ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">Earn 10 Points</div>
        <p className="text-xs text-muted-foreground mb-4">
          {questCompletedToday ? "Come back tomorrow for a new quest!" : "Complete a simple task to earn points."}
        </p>
        <Button
          onClick={handleCompleteQuest}
          disabled={questCompletedToday}
          className="w-full"
        >
          {questCompletedToday ? "Quest Completed" : "Complete Quest"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DailyQuestCard;