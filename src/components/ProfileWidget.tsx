"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { calculateMaxXpForLevel } from "@/utils/leveling";
import { generateAvatarUrl } from "@/lib/utils"; // Assuming this utility exists

const ProfileWidget = () => {
  const { user, userProfile, isLoading } = useAuth();

  if (isLoading || !user || !userProfile) {
    return (
      <div className="flex items-center space-x-2 p-2">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse"></div>
        <div className="flex-1 space-y-1">
          <div className="h-4 w-3/4 bg-muted animate-pulse rounded"></div>
          <div className="h-3 w-1/2 bg-muted animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  const displayName = userProfile.firstName && userProfile.lastName 
    ? `${userProfile.firstName} ${userProfile.lastName}` 
    : user.name;

  const avatarUrl = userProfile.profilePictureUrl || generateAvatarUrl(
    displayName,
    userProfile.gender || "prefer-not-to-say", // Fixed: Use existing gender or default
    userProfile.userType || "student" // Fixed: Use existing userType or default
  );

  const currentXp = userProfile.currentXp ?? 0;
  const maxXp = calculateMaxXpForLevel(userProfile.level ?? 1); // Fixed: Calculate maxXp
  const xpPercentage = (currentXp / maxXp) * 100;

  return (
    <div className="flex items-center space-x-3 p-2">
      <Avatar className="h-10 w-10 border-2 border-secondary-neon">
        <AvatarImage src={avatarUrl} alt={displayName} />
        <AvatarFallback className="bg-secondary-neon text-primary-foreground">{displayName.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{displayName}</p>
        <div className="flex items-center text-xs text-muted-foreground">
          <span>Level {userProfile.level}</span>
          <Progress value={xpPercentage} className="w-20 h-1.5 ml-2 bg-muted [&>*]:bg-secondary-neon" />
        </div>
      </div>
    </div>
  );
};

export default ProfileWidget;