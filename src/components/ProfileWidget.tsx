"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { User, DollarSign, Award } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { generateAvatarUrl } from "@/utils/avatarGenerator";
import { calculateCommissionRate, formatCommissionRate } from "@/utils/commission";
import { getLevelBadge } from "@/utils/badges";
import { getGraduationData } from "@/utils/time";

const ProfileWidget = () => {
  const { user, userProfile } = useAuth();

  const displayName = user?.name || "CampusExplorer";
  
  const userLevel = userProfile?.level ?? 1;
  const currentXp = userProfile?.currentXp ?? 0;
  const maxXp = userProfile?.maxXp ?? 100;
  const xpPercentage = (currentXp / maxXp) * 100;
  
  const commissionRate = calculateCommissionRate(userLevel);
  const userBadge = getLevelBadge(userLevel);

  const avatarUrl = generateAvatarUrl(
    displayName,
    userProfile?.gender || "prefer-not-to-say",
    userProfile?.userType || "student",
    userProfile?.avatarStyle || "lorelei" // NEW: Pass avatarStyle
  );

  const renderMotivationalMessage = () => {
    if (userProfile?.userType !== "student" || userProfile?.role === "developer") {
      return null; // Only for students, not developers
    }

    const userCreationDate = user?.$createdAt;
    if (!userCreationDate) return null;

    const graduationInfo = getGraduationData(userCreationDate);
    const targetLevel = 25;
    const levelsToGo = targetLevel - userProfile.level;
    const daysRemaining = graduationInfo.countdown.days;

    if (graduationInfo.isGraduated) {
      return (
        <p className="text-sm text-muted-foreground mt-2">
          You've completed your journey! We hope you gained valuable skills and connections.
        </p>
      );
    }

    if (userProfile.level >= targetLevel) {
      return (
        <p className="text-sm text-green-500 mt-2 font-semibold">
          Congratulations! You've reached Level {targetLevel} and achieved the lowest commission rate. Keep up the great work!
        </p>
      );
    }

    let message = "";
    if (userLevel >= 1 && userLevel <= 5) {
      message = "Welcome to the campus hustle! Every listing, every interaction, builds your rep. Aim for Level 25 to unlock sweet commission rates and become a campus legend!";
    } else if (userLevel >= 6 && userLevel <= 10) {
      message = "You're getting the hang of it! Keep connecting, selling, and helping out. Level up to reduce those commission fees and make more from your grind!";
    } else if (userLevel >= 11 && userLevel <= 15) {
      message = "Halfway to the top! Your influence is growing. Master new skills, offer more services, and watch that commission rate drop even further. You're building a legacy!";
    } else if (userLevel >= 16 && userLevel <= 20) {
      message = "Almost there, champ! You're a key player in the campus economy. Push for Level 25 to secure the ultimate commission rate and truly thrive.";
    } else if (userLevel >= 21 && userLevel <= 24) {
      message = "The finish line is in sight! Just a few more levels to become a true Campus Legend and lock in the lowest commission. Keep innovating, keep earning, and make your final year count!";
    }

    if (daysRemaining > 0 && levelsToGo > 0) {
      message += ` You have ${daysRemaining} days left before graduation.`;
    } else if (daysRemaining <= 0 && levelsToGo > 0) {
      message += ` Time is running out! Focus on learning new skills to reach Level ${targetLevel}.`;
    }

    return (
      <p className="text-sm text-muted-foreground mt-2">
        {message}
      </p>
    );
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardContent className="p-4 flex items-center space-x-4">
        <Avatar className="h-16 w-16 border-2 border-secondary-neon">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            <User className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-grow space-y-1">
          <h3 className="text-xl font-bold text-foreground">{displayName}</h3>
          <p className="text-sm text-muted-foreground">Level {userLevel}</p>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={xpPercentage} className="h-2 bg-muted-foreground/30 [&::-webkit-progress-bar]:bg-secondary-neon [&::-webkit-progress-value]:bg-secondary-neon" />
            <span className="text-xs text-muted-foreground">{currentXp}/{maxXp} XP</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground pt-1">
            <DollarSign className="h-3 w-3 mr-1 text-secondary-neon" />
            Commission Rate: <span className="font-semibold text-foreground ml-1">{formatCommissionRate(commissionRate)}</span>
          </div>
          {userBadge && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Award className="h-3 w-3 mr-1 text-secondary-neon" />
              Badge: <span className="font-semibold text-foreground ml-1">{userBadge}</span>
            </div>
          )}
          {renderMotivationalMessage()}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileWidget;