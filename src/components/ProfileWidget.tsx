import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/context/AuthContext';
import { Loader2, User } from 'lucide-react';
import { generateAvatarUrl } from '@/lib/utils'; // Import the utility function

const ProfileWidget: React.FC = () => {
  const { user, userProfile, loading: isAuthLoading } = useAuth(); // Corrected 'isLoading' to 'loading'

  if (isAuthLoading) {
    return (
      <Card className="bg-card border-border-dark text-foreground">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Your Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
        </CardContent>
      </Card>
    );
  }

  if (!user || !userProfile) {
    return (
      <Card className="bg-card border-border-dark text-foreground">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Your Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </CardContent>
      </Card>
    );
  }

  const displayName = userProfile.firstName && userProfile.lastName
    ? `${userProfile.firstName} ${userProfile.lastName}`
    : user.name || user.email;

  const userLevel = userProfile?.level ?? 1;
  const currentXp = userProfile?.xp ?? 0; // Use 'xp' from UserProfile
  const maxXp = userProfile?.maxXp ?? 100; // Use 'maxXp' from UserProfile
  const xpPercentage = (currentXp / maxXp) * 100;

  const avatarUrl = generateAvatarUrl(
    displayName,
    userProfile?.gender || "prefer-not-to-say",
    userProfile?.userType || "student",
    userProfile?.avatarStyle || "lorelei" // NEW: Pass avatarStyle
  );

  return (
    <Card className="bg-card border-border-dark text-foreground">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Your Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16 border-2 border-primary-blue-light">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-primary-blue text-primary-foreground">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-xl font-bold">{displayName}</p>
            <p className="text-sm text-muted-foreground">{userProfile.collegeName || 'N/A'}</p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">Level {userLevel}</p>
          <Progress value={xpPercentage} className="w-full h-2 bg-border-dark" indicatorClassName="bg-secondary-neon" />
          <p className="text-xs text-muted-foreground">{currentXp}/{maxXp} XP</p>
        </div>

        <div className="flex items-center text-sm text-muted-foreground">
          <User className="h-4 w-4 mr-2 text-primary-blue-light" />
          <span>{userProfile.userType === 'developer' ? 'Developer' : userProfile.userType === 'ambassador' ? 'Ambassador' : 'Student'}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileWidget;