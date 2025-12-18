"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { Loader2, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateAvatarUrl } from "@/utils/avatar";
import { Badge } from "@/components/ui/badge";

const ProfileWidget = () => {
  const { user, userProfile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Card className="bg-card text-card-foreground shadow-lg border-border">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
          <p className="ml-2 text-muted-foreground">Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  if (!user || !userProfile) {
    return (
      <Card className="bg-card text-card-foreground shadow-lg border-border">
        <CardContent className="p-4 text-center text-muted-foreground">
          Please log in to view your profile.
        </CardContent>
      </Card>
    );
  }

  const displayName = userProfile.name || user.name || "User";
  const userLevel = userProfile?.level ?? 1;
  const currentXp = userProfile?.currentXp ?? 0;
  const maxXp = userProfile?.maxXp ?? 100;
  const xpPercentage = (currentXp / maxXp) * 100;

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

    if (userLevel < 5) {
      return <p className="text-sm text-muted-foreground mt-2">Keep exploring and listing to level up!</p>;
    }
    if (userLevel < 10) {
      return <p className="text-sm text-muted-foreground mt-2">You're doing great! Aim for the next milestone.</p>;
    }
    return <p className="text-sm text-muted-foreground mt-2">A true campus legend! Keep up the amazing work.</p>;
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12 border-2 border-secondary-neon">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback><User className="h-6 w-6" /></AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl font-semibold text-foreground">{displayName}</CardTitle>
            <p className="text-sm text-muted-foreground">{userProfile.collegeName}</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-secondary-neon text-primary-foreground px-3 py-1 text-sm">
          Level {userLevel}
        </Badge>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="mt-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>XP: {currentXp}/{maxXp}</span>
            <span>{xpPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={xpPercentage} className="w-full h-2 mt-1 bg-muted" indicatorClassName="bg-secondary-neon" />
        </div>
        {renderMotivationalMessage()}
      </CardContent>
    </Card>
  );
};

export default ProfileWidget;