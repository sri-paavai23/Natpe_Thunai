"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { User, DollarSign, Award } from "lucide-react"; // Import Award icon
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import { generateAvatarUrl } from "@/utils/avatarGenerator"; // Import new avatar generator
import { calculateCommissionRate, formatCommissionRate } from "@/utils/commission"; // Import commission utils
import { getLevelBadge } from "@/utils/badges"; // NEW: Import getLevelBadge

const ProfileWidget = () => {
  const { user, userProfile } = useAuth();

  // Use the public username (user.name) for display everywhere except private profile page
  const displayName = user?.name || "CampusExplorer";
  
  // Use dynamic data from userProfile, defaulting to Level 1 / 0 XP
  const userLevel = userProfile?.level ?? 1;
  const currentXp = userProfile?.currentXp ?? 0;
  const maxXp = userProfile?.maxXp ?? 100;
  const xpPercentage = (currentXp / maxXp) * 100;
  
  const commissionRate = calculateCommissionRate(userLevel);
  const userBadge = getLevelBadge(userLevel); // NEW: Get user's badge

  const avatarUrl = generateAvatarUrl(
    displayName,
    userProfile?.gender || "prefer-not-to-say",
    userProfile?.userType || "student"
  );

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
          {userBadge && ( // NEW: Display user's badge
            <div className="flex items-center text-xs text-muted-foreground">
              <Award className="h-3 w-3 mr-1 text-secondary-neon" />
              Badge: <span className="font-semibold text-foreground ml-1">{userBadge}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileWidget;