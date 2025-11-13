"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, UserCheck, Award, TrendingUp, Edit, User, Briefcase } from "lucide-react"; // Added User and Briefcase icons
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EditProfileForm from "@/components/forms/EditProfileForm"; // Import the new form
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import { generateAvatarUrl } from "@/utils/avatarGenerator"; // Import new avatar generator

const ProfileDetailsPage = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Use the public username (user.name) for the main display name and avatar seed
  const publicUsername = user?.name || "CampusExplorer";
  const userEmail = user?.email || "N/A"; // Define userEmail here
  
  const userLevel = 5; // Placeholder, assuming level is not in Appwrite profile yet
  const currentXp = 75; // Placeholder
  const maxXp = 100; // Placeholder
  const xpPercentage = (currentXp / maxXp) * 100;
  const sellerRating = 4.7;
  const isVerified = true; // Placeholder for verification status
  const badges = ["Top Seller", "Early Adopter"];

  const avatarUrl = generateAvatarUrl(
    publicUsername,
    userProfile?.gender || "prefer-not-to-say",
    userProfile?.userType || "student"
  );

  const handleSaveProfile = async (data: {
    firstName: string;
    lastName: string;
    age: number;
    mobileNumber: string;
    upiId: string;
    gender: "male" | "female" | "prefer-not-to-say"; // Added gender
    userType: "student" | "staff"; // Added userType
  }) => {
    if (userProfile) {
      await updateUserProfile(userProfile.$id, data);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">User Profile</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-secondary-neon" /> Your Details
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)} className="text-muted-foreground hover:text-secondary-neon">
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit Profile</span>
            </Button>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 text-center sm:text-left">
              <Avatar className="h-20 w-20 border-2 border-secondary-neon">
                <AvatarImage src={avatarUrl} alt={publicUsername} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {publicUsername.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-2xl font-bold text-foreground">{publicUsername}</h3>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
                {isVerified && (
                  <Badge className="mt-1 bg-blue-500 text-white flex items-center gap-1 w-fit mx-auto sm:mx-0">
                    <UserCheck className="h-3 w-3" /> Verified
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-secondary-neon" /> Level {userLevel}
              </p>
              <div className="flex items-center gap-2">
                <Progress value={xpPercentage} className="h-2 bg-muted-foreground/30 [&::-webkit-progress-bar]:bg-secondary-neon [&::-webkit-progress-value]:bg-secondary-neon" />
                <span className="text-xs text-muted-foreground">{currentXp}/{maxXp} XP</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4 text-secondary-neon" /> Seller Rating: <span className="font-semibold text-foreground">{sellerRating.toFixed(1)}</span>
              </p>
            </div>

            {badges.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Award className="h-4 w-4 text-secondary-neon" /> Badges:
                </p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {badges.map((badge, index) => (
                    <Badge key={index} variant="secondary" className="bg-primary-blue-light text-primary-foreground">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {userProfile && (
              <div className="space-y-2 pt-4 border-t border-border">
                <h4 className="text-lg font-semibold text-foreground">Private Details (Visible to Developers)</h4>
                <p className="text-sm text-muted-foreground">First Name: <span className="font-semibold text-foreground">{userProfile.firstName}</span></p>
                <p className="text-sm text-muted-foreground">Last Name: <span className="font-semibold text-foreground">{userProfile.lastName}</span></p>
                <p className="text-sm text-muted-foreground">Age: <span className="font-semibold text-foreground">{userProfile.age}</span></p>
                <p className="text-sm text-muted-foreground">Mobile: <span className="font-semibold text-foreground">{userProfile.mobileNumber}</span></p>
                <p className="text-sm text-muted-foreground">UPI ID: <span className="font-semibold text-foreground">{userProfile.upiId}</span></p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4 text-secondary-neon" /> Gender: <span className="font-semibold text-foreground capitalize">{userProfile.gender.replace(/-/g, ' ')}</span>
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-secondary-neon" /> Type: <span className="font-semibold text-foreground capitalize">{userProfile.userType}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Profile Details</DialogTitle>
          </DialogHeader>
          {userProfile && (
            <EditProfileForm
              initialData={{
                firstName: userProfile.firstName,
                lastName: userProfile.lastName,
                age: userProfile.age,
                mobileNumber: userProfile.mobileNumber,
                upiId: userProfile.upiId,
                gender: userProfile.gender, // Pass gender
                userType: userProfile.userType, // Pass userType
              }}
              onSave={handleSaveProfile}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileDetailsPage;