"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, UserCheck, Award, TrendingUp, Edit, User, Briefcase, DollarSign, Building2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EditProfileForm from "@/components/forms/EditProfileForm";
import { useAuth } from "@/context/AuthContext";
import { generateAvatarUrl } from "@/utils/avatarGenerator";
import { calculateCommissionRate, formatCommissionRate } from "@/utils/commission";
import { getLevelBadge } from "@/utils/badges";
import ReportMissingCollegeForm from "@/components/forms/ReportMissingCollegeForm";
import { getGraduationData } from "@/utils/time";

const ProfileDetailsPage = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReportMissingCollegeDialogOpen, setIsReportMissingCollegeDialogOpen] = useState(false);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const publicUsername = user?.name || "CampusExplorer";
  const userEmail = user?.email || "N/A";
  
  const userLevel = userProfile?.level ?? 1;
  const currentXp = userProfile?.currentXp ?? 0;
  const maxXp = userProfile?.maxXp ?? 100;
  const xpPercentage = (currentXp / maxXp) * 100;
  
  const commissionRate = calculateCommissionRate(userLevel);
  const userBadge = getLevelBadge(userLevel);

  const sellerRating = 4.7; // Placeholder
  const isVerified = true; // Placeholder for verification status

  const avatarUrl = generateAvatarUrl(
    publicUsername,
    userProfile?.gender || "prefer-not-to-say",
    userProfile?.userType || "student",
    userProfile?.avatarStyle || "lorelei" // NEW: Pass avatarStyle
  );

  const handleSaveProfile = async (data: {
    firstName: string;
    lastName: string;
    age: number;
    mobileNumber: string;
    upiId: string;
    gender: "male" | "female" | "prefer-not-to-say";
    userType: "student" | "staff";
    collegeName: string;
    avatarStyle: string; // NEW: Add avatarStyle
  }) => {
    if (userProfile) {
      await updateUserProfile(userProfile.$id, data);
    }
  };

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
                {user?.emailVerification && (
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
                <Progress value={xpPercentage} className="h-2 bg-muted-foreground/30 [&::-webkit-progress-bar]:bg-secondary-neon [&::-::-webkit-progress-value]:bg-secondary-neon" />
                <span className="text-xs text-muted-foreground">{currentXp}/{maxXp} XP</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-secondary-neon" /> Current Commission Rate: <span className="font-semibold text-foreground">{formatCommissionRate(commissionRate)}</span>
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4 text-secondary-neon" /> Seller Rating: <span className="font-semibold text-foreground">{sellerRating.toFixed(1)}</span>
              </p>
            </div>

            {userBadge && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Award className="h-4 w-4 text-secondary-neon" /> Badge: <span className="font-semibold text-foreground">{userBadge}</span>
                </p>
              </div>
            )}
            {renderMotivationalMessage()}
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
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-secondary-neon" /> College: <span className="font-semibold text-foreground">{userProfile.collegeName}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
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
                gender: userProfile.gender,
                userType: userProfile.userType,
                collegeName: userProfile.collegeName,
                avatarStyle: userProfile.avatarStyle, // NEW: Pass avatarStyle
              }}
              onSave={handleSaveProfile}
              onCancel={() => setIsEditDialogOpen(false)} // Pass onCancel to close dialog
            />
          )}
          <Dialog open={isReportMissingCollegeDialogOpen} onOpenChange={setIsReportMissingCollegeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="link" className="p-0 h-auto text-secondary-neon hover:underline mt-2 flex items-center gap-1 mx-auto">
                <Building2 className="h-3 w-3" /> Cannot find my college
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Report Missing College</DialogTitle>
              </DialogHeader>
              <ReportMissingCollegeForm
                onReportSubmitted={() => setIsReportMissingCollegeDialogOpen(false)}
                onCancel={() => setIsReportMissingCollegeDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileDetailsPage;