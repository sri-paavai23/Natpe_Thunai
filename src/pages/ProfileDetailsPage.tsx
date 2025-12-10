"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { Loader2, User, Mail, Phone, Cake, MapPin, GraduationCap, Wallet, HeartHandshake, ShieldCheck, Edit } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generateAvatarUrl } from "@/utils/avatarGenerator";
import EditProfileForm from "@/components/forms/EditProfileForm";
import { toast } from "sonner";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { Link } from "react-router-dom";
import ContributionStoryDialog from "@/components/ContributionStoryDialog";

const ProfileDetailsPage = () => {
  const { user, userProfile, isLoading, refreshUserProfile } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false);

  const handleSaveProfile = async (data: any) => {
    if (!userProfile) {
      toast.error("No profile to update.");
      throw new Error("No profile to update.");
    }
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        userProfile.$id,
        data
      );
      await refreshUserProfile(); // Refresh the profile context
      toast.success("Profile updated successfully!");
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile.");
      throw error; // Re-throw to be caught by react-hook-form
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-secondary-neon" />
        <p className="ml-3 text-lg text-muted-foreground">Loading profile details...</p>
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <p className="text-xl text-muted-foreground mb-4">Please log in to view your profile.</p>
        <Button asChild className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          <Link to="/auth">Go to Login</Link>
        </Button>
      </div>
    );
  }

  const avatarSeed = userProfile.firstName || "User";
  const avatarUrl = generateAvatarUrl(
    avatarSeed,
    userProfile.avatarStyle || "lorelei",
    128 // Explicitly pass size
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">My Profile</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <User className="h-5 w-5 text-secondary-neon" /> Personal Details
            </CardTitle>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-border text-primary-foreground hover:bg-muted">
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Edit Profile</DialogTitle>
                </DialogHeader>
                <EditProfileForm
                  initialData={{
                    firstName: userProfile.firstName,
                    lastName: userProfile.lastName,
                    age: userProfile.age,
                    mobileNumber: userProfile.mobileNumber,
                    upiId: userProfile.upiId || "",
                    gender: userProfile.gender,
                    userType: userProfile.userType,
                    collegeName: userProfile.collegeName,
                    otherCollegeName: userProfile.otherCollegeName || "",
                    avatarStyle: userProfile.avatarStyle || "pixel-art",
                  }}
                  onSave={handleSaveProfile}
                  onCancel={() => setIsEditDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <div className="flex items-center justify-center py-4">
              <Avatar className="h-24 w-24 border-4 border-secondary-neon">
                <AvatarImage src={avatarUrl} alt={userProfile.firstName} />
                <AvatarFallback>
                  <User className="h-12 w-12 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> <span className="font-medium text-foreground">Name:</span> {userProfile.firstName} {userProfile.lastName}</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> <span className="font-medium text-foreground">Email:</span> {user.email}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> <span className="font-medium text-foreground">Mobile:</span> {userProfile.mobileNumber}</p>
              <p className="flex items-center gap-2"><Cake className="h-4 w-4 text-muted-foreground" /> <span className="font-medium text-foreground">Age:</span> {userProfile.age}</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> <span className="font-medium text-foreground">College:</span> {userProfile.collegeName}</p>
              <p className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-muted-foreground" /> <span className="font-medium text-foreground">Type:</span> {userProfile.userType === "student" ? "Student" : "Staff"}</p>
              {userProfile.upiId && (
                <p className="flex items-center gap-2 col-span-full"><Wallet className="h-4 w-4 text-muted-foreground" /> <span className="font-medium text-foreground">UPI ID:</span> {userProfile.upiId}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-secondary-neon" /> Contribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Natpe🤝Thunai is built with passion for the student community. Your contributions help us maintain and improve the platform.
            </p>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setIsContributionDialogOpen(true)}>
              Learn More & Contribute
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-secondary-neon" /> Policies
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Review our terms of service, privacy policy, and community guidelines.
            </p>
            <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/profile/policies">View Policies</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
      <ContributionStoryDialog isOpen={isContributionDialogOpen} onClose={() => setIsContributionDialogOpen(false)} />
    </div>
  );
};

export default ProfileDetailsPage;