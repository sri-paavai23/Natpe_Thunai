"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { User, DollarSign, Award, Zap, TrendingUp } from "lucide-react"; // Added Zap and TrendingUp
import { useAuth } from "@/context/AuthContext";
import { generateAvatarUrl } from "@/utils/avatarGenerator";
import { calculateCommissionRate, formatCommissionRate } from "@/utils/commission";
import { getLevelBadge } from "@/utils/badges";
import { getGraduationData } from "@/utils/time";
import { cn } from "@/lib/utils"; // Import cn for conditional classNames

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
    userProfile?.avatarStyle || "lorelei"
  );

  const renderMotivationalMessage = () => {
    if (userProfile?.userType !== "student" || userProfile?.role === "developer") {
      return null;
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
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary-blue-light to-secondary-neon text-white shadow-lg rounded-xl border-none">
      {/* Background elements for funky design */}
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full mix-blend-overlay blur-xl"></div>
      <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-white/15 rounded-full mix-blend-overlay blur-xl"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full mix-blend-overlay blur-xl"></div>

      <CardContent className="relative z-10 p-6 flex flex-col items-center text-center space-y-4">
        <Avatar className="h-24 w-24 border-4 border-white shadow-md transition-transform duration-300 hover:scale-105">
          <AvatarImage src={avatarUrl} alt={displayName} />
          <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
            <User className="h-12 w-12" />
          </AvatarFallback>
        </Avatar>
        
        <div className="space-y-1">
          <h3 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">{displayName}</h3>
          <p className="text-lg font-medium text-white/90 flex items-center justify-center gap-2">
            <Zap className="h-5 w-5 text-yellow-300" /> Level {userLevel}
          </p>
        </div>

        <div className="w-full max-w-xs space-y-2">
          <div className="flex items-center gap-2">
            <Progress value={xpPercentage} className="h-2 bg-white/30 [&::-webkit-progress-bar]:bg-white/50 [&::-webkit-progress-value]:bg-white" />
            <span className="text-xs text-white/80 whitespace-nowrap">{currentXp}/{maxXp} XP</span>
          </div>
          <div className="flex items-center justify-center text-sm text-white/90">
            <DollarSign className="h-4 w-4 mr-1 text-green-300" />
            Commission Rate: <span className="font-bold ml-1">{formatCommissionRate(commissionRate)}</span>
          </div>
          {userBadge && (
            <div className="flex items-center justify-center text-sm text-white/90">
              <Award className="h-4 w-4 mr-1 text-purple-300" />
              Badge: <span className="font-bold ml-1">{userBadge}</span>
            </div>
          )}
        </div>
        
        {renderMotivationalMessage() && (
          <div className="mt-3 p-3 bg-white/10 rounded-md text-white/90 text-sm italic max-w-sm">
            {renderMotivationalMessage()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileWidget;