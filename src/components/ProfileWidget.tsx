"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import { generateAvatarUrl } from "@/utils/avatarGenerator"; // Import new avatar generator

const ProfileWidget = () => {
  const { user, userProfile } = useAuth();

  // Prioritize userProfile's first and last name, then Appwrite user name, then fallback
  const displayName = userProfile
    ? `${userProfile.firstName} ${userProfile.lastName}`
    : user?.name || "CampusExplorer";
  
  const userLevel = 5; // Placeholder, assuming level is not in Appwrite profile yet
  const currentXp = 75; // Placeholder
  const maxXp = 100; // Placeholder
  const xpPercentage = (currentXp / maxXp) * 100;

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
        <div className="flex-grow">
          <h3 className="text-xl font-bold text-foreground">{displayName}</h3>
          <p className="text-sm text-muted-foreground">Level {userLevel}</p>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={xpPercentage} className="h-2 bg-muted-foreground/30 [&::-webkit-progress-bar]:bg-secondary-neon [&::-webkit-progress-value]:bg-secondary-neon" />
            <span className="text-xs text-muted-foreground">{currentXp}/{maxXp} XP</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileWidget;