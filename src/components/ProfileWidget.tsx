"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { generateAvatarUrl } from "@/utils/avatarGenerator";
import { Loader2, User } from "lucide-react";

const ProfileWidget = () => {
  const { userProfile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Card className="bg-card text-card-foreground shadow-lg border-border p-4 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
        <p className="ml-2 text-muted-foreground">Loading profile...</p>
      </Card>
    );
  }

  if (!userProfile) {
    return (
      <Card className="bg-card text-card-foreground shadow-lg border-border p-4 text-center">
        <p className="text-muted-foreground mb-2">Profile not found. Please log in.</p>
        <Button asChild className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          <Link to="/auth">Login</Link>
        </Button>
      </Card>
    );
  }

  const avatarSeed = userProfile.firstName || "User";
  const avatarUrl = generateAvatarUrl(
    avatarSeed,
    userProfile.avatarStyle || "lorelei",
    128 // Explicitly pass size
  );

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardContent className="flex items-center p-4">
        <Avatar className="h-16 w-16 border-2 border-secondary-neon">
          <AvatarImage src={avatarUrl} alt={userProfile.firstName} />
          <AvatarFallback>
            <User className="h-8 w-8 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <div className="ml-4 flex-grow">
          <h3 className="text-xl font-semibold text-foreground">
            {userProfile.firstName} {userProfile.lastName}
          </h3>
          <p className="text-sm text-muted-foreground">{userProfile.collegeName}</p>
          <p className="text-xs text-muted-foreground">
            {userProfile.userType === "student" ? "Student" : "Staff"}
          </p>
        </div>
        <Button asChild variant="outline" className="border-border text-primary-foreground hover:bg-muted">
          <Link to="/profile/details">Edit Profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileWidget;