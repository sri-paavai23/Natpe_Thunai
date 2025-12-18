"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, Mail, Phone, Home, Briefcase, Calendar, DollarSign, Shield, Image as ImageIcon, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateAvatarUrl } from "@/utils/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EditProfileForm from "@/components/forms/EditProfileForm";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { MadeWithDyad } from "@/components/made-with-dyad";
import ReportMissingCollegeForm from "@/components/forms/ReportMissingCollegeForm";

const ProfileDetailsPage = () => {
  const { user, userProfile, isLoading, updateUserProfile } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReportMissingCollegeDialogOpen, setIsReportMissingCollegeDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-secondary-neon" />
        <p className="ml-3 text-lg text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <User className="h-10 w-10 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Profile Not Found</h1>
        <p className="text-muted-foreground text-center">Please log in to view your profile details.</p>
      </div>
    );
  }

  const publicUsername = userProfile.name || user.name || "User";
  const userLevel = userProfile?.level ?? 1;
  const currentXp = userProfile?.currentXp ?? 0;
  const maxXp = userProfile?.maxXp ?? 100;
  const xpPercentage = (currentXp / maxXp) * 100;

  const avatarUrl = generateAvatarUrl(
    publicUsername,
    userProfile?.gender || "prefer-not-to-say",
    userProfile?.userType || "student",
    userProfile?.avatarStyle || "lorelei"
  );

  const handleProfileUpdate = async (data: any) => {
    if (userProfile) {
      await updateUserProfile(data);
      setIsEditDialogOpen(false);
    }
  };

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
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">My Profile</h1>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20 border-4 border-secondary-neon">
                <AvatarImage src={avatarUrl} alt={publicUsername} />
                <AvatarFallback><User className="h-10 w-10" /></AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">{publicUsername}</CardTitle>
                <p className="text-md text-muted-foreground">{userProfile.collegeName}</p>
                <Badge variant="secondary" className="bg-secondary-neon text-primary-foreground px-3 py-1 text-sm mt-1">
                  Level {userLevel}
                </Badge>
              </div>
            </div>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-border text-primary-foreground hover:bg-muted">
                  Edit Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Edit Profile</DialogTitle>
                </DialogHeader>
                <EditProfileForm
                  onSubmit={handleProfileUpdate}
                  onCancel={() => setIsEditDialogOpen(false)}
                  initialData={{
                    firstName: userProfile.firstName,
                    lastName: userProfile.lastName,
                    age: userProfile.age,
                    mobileNumber: userProfile.mobileNumber,
                    upiId: userProfile.upiId,
                    gender: userProfile.gender,
                    userType: userProfile.userType,
                    collegeName: userProfile.collegeName,
                    avatarStyle: userProfile.avatarStyle,
                    hostelRoom: userProfile.hostelRoom,
                    phone: userProfile.phone,
                  }}
                />
              </DialogContent>
            </Dialog>
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

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Public Details</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-secondary-neon" /> Email: <span className="font-semibold text-foreground">{userProfile.email}</span>
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Home className="h-4 w-4 text-secondary-neon" /> College: <span className="font-semibold text-foreground">{userProfile.collegeName}</span>
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-secondary-neon" /> Role: <span className="font-semibold text-foreground capitalize">{userProfile.role}</span>
            </p>
            {userProfile.hostelRoom && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Home className="h-4 w-4 text-secondary-neon" /> Hostel/Room: <span className="font-semibold text-foreground">{userProfile.hostelRoom}</span>
              </p>
            )}
            {userProfile.phone && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4 text-secondary-neon" /> Phone: <span className="font-semibold text-foreground">{userProfile.phone}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {userProfile.role === "developer" && (
          <Card className="bg-card text-card-foreground shadow-lg border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xl font-semibold text-card-foreground">Private Details (Visible to Developers)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              <p className="text-sm text-muted-foreground">First Name: <span className="font-semibold text-foreground">{userProfile.firstName}</span></p>
              <p className="text-sm text-muted-foreground">Last Name: <span className="font-semibold text-foreground">{userProfile.lastName}</span></p>
              <p className="text-sm text-muted-foreground">Age: <span className="font-semibold text-foreground">{userProfile.age}</span></p>
              <p className="text-sm text-muted-foreground">Mobile: <span className="font-semibold text-foreground">{userProfile.mobileNumber}</span></p>
              <p className="text-sm text-muted-foreground">UPI ID: <span className="font-semibold text-foreground">{userProfile.upiId}</span></p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-secondary-neon" /> Gender: <span className="font-semibold text-foreground capitalize">{userProfile.gender?.replace(/-/g, ' ')}</span>
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-secondary-neon" /> Type: <span className="font-semibold text-foreground capitalize">{userProfile.userType}</span>
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-secondary-neon" /> Avatar Style: <span className="font-semibold text-foreground capitalize">{userProfile.avatarStyle}</span>
              </p>
            </CardContent>
          </Card>
        )}

        {userProfile.role === "ambassador" && (
          <Card className="bg-card text-card-foreground shadow-lg border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xl font-semibold text-card-foreground">Ambassador Stats</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-secondary-neon" /> Deliveries Completed: <span className="font-semibold text-foreground">{userProfile.ambassadorDeliveriesCount ?? 0}</span>
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ProfileDetailsPage;