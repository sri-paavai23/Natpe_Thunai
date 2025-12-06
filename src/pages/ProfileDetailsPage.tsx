"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, MapPin, GraduationCap, Briefcase, Star, Settings, LogOut, MessageSquareText, Wallet, TrendingUp, Trophy, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DeveloperChatbox from "@/components/DeveloperChatbox";
import { calculateCommissionRate, formatCommissionRate } from "@/utils/commission";
import { calculateMaxXpForLevel } from "@/utils/leveling";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import EditProfileForm from "@/components/forms/EditProfileForm"; // Assuming this component exists

const ProfileDetailsPage = () => {
  const { user, userProfile, logout, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to log out.");
    }
  };

  const handleProfileUpdate = async (data: any) => {
    if (userProfile) {
      await updateUserProfile(data); // Fixed: Pass only data object
      setIsEditing(false);
    }
  };

  const userLevel = userProfile?.level ?? 1;
  const currentXp = userProfile?.currentXp ?? 0;
  const maxXp = calculateMaxXpForLevel(userLevel); // Fixed: Calculate maxXp
  const xpPercentage = (currentXp / maxXp) * 100;
  const dynamicCommissionRateDisplay = formatCommissionRate(calculateCommissionRate(userLevel));

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <p className="text-lg text-muted-foreground">Please log in to view your profile.</p>
      </div>
    );
  }

  const publicUsername = userProfile.firstName && userProfile.lastName 
    ? `${userProfile.firstName} ${userProfile.lastName}` 
    : user.name;

  const avatarUrl = userProfile.profilePictureUrl || generateAvatarUrl(
    publicUsername,
    userProfile.gender || "prefer-not-to-say", // Fixed: Use existing gender or default
    userProfile.userType || "student" // Fixed: Use existing userType or default
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">My Profile</h1>
      <div className="max-w-md mx-auto space-y-6">
        {/* User Info Card */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Avatar className="h-24 w-24 mb-4 border-2 border-secondary-neon">
              <AvatarImage src={avatarUrl} alt={publicUsername} />
              <AvatarFallback className="bg-secondary-neon text-primary-foreground text-3xl">{publicUsername.charAt(0)}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold text-foreground">{publicUsername}</h2>
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <Mail className="h-4 w-4" /> {user.email}
            </p>
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <Phone className="h-4 w-4" /> {userProfile.mobileNumber || "N/A"}
            </p>
            <Badge className="mt-3 bg-primary-blue-light text-primary-foreground">{userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}</Badge>
          </CardContent>
        </Card>

        {/* Level and XP Progress */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Star className="h-5 w-5 text-secondary-neon" /> Level & Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-lg font-medium text-foreground">Level {userLevel}</p>
              <p className="text-sm text-muted-foreground">{currentXp} / {maxXp} XP</p>
            </div>
            <Progress value={xpPercentage} className="w-full h-2 bg-muted [&>*]:bg-secondary-neon" />
            <p className="text-xs text-muted-foreground">Complete quests and daily logins to earn XP and level up!</p>
          </CardContent>
        </Card>

        {/* Tabs for more details */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full overflow-x-auto whitespace-nowrap bg-primary-blue-light text-primary-foreground h-auto p-1">
            <TabsTrigger value="overview" className="flex-shrink-0 min-w-[120px] text-xs sm:text-sm data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Overview</TabsTrigger>
            <TabsTrigger value="private" className="flex-shrink-0 min-w-[120px] text-xs sm:text-sm data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Private</TabsTrigger>
            <TabsTrigger value="wallet" className="flex-shrink-0 min-w-[120px] text-xs sm:text-sm data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Wallet</TabsTrigger>
            <TabsTrigger value="policies" className="flex-shrink-0 min-w-[120px] text-xs sm:text-sm data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Policies</TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            <TabsContent value="overview">
              <Card className="bg-card text-card-foreground shadow-lg border-border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                    <User className="h-5 w-5 text-secondary-neon" /> Public Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <p>{userProfile.address || "N/A"}</p>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <GraduationCap className="h-4 w-4" />
                    <p>{userProfile.collegeName || "N/A"}</p>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-4 w-4" />
                    <p>{userProfile.department || "N/A"}</p>
                  </div>
                  <Button variant="outline" className="w-full border-border text-primary-foreground hover:bg-muted" onClick={() => setIsEditing(true)}>
                    <Settings className="mr-2 h-4 w-4" /> Edit Profile
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="private">
              <Card className="bg-card text-card-foreground shadow-lg border-border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-secondary-neon" /> Private Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <h4 className="text-lg font-semibold text-foreground">Private Details (Visible to Developers)</h4>
                  <p className="text-sm text-muted-foreground">First Name: <span className="font-semibold text-foreground">{userProfile.firstName || "N/A"}</span></p> {/* Fixed */}
                  <p className="text-sm text-muted-foreground">Last Name: <span className="font-semibold text-foreground">{userProfile.lastName || "N/A"}</span></p> {/* Fixed */}
                  <p className="text-sm text-muted-foreground">Age: <span className="font-semibold text-foreground">{userProfile.age || "N/A"}</span></p> {/* Fixed */}
                  <p className="text-sm text-muted-foreground">Mobile: <span className="font-semibold text-foreground">{userProfile.mobileNumber || "N/A"}</span></p>
                  <p className="text-sm text-muted-foreground">UPI ID: <span className="font-semibold text-foreground">{userProfile.upiId || "N/A"}</span></p> {/* Fixed */}
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-secondary-neon" /> Gender: <span className="font-semibold text-foreground capitalize">{userProfile.gender?.replace(/-/g, ' ') || "N/A"}</span> {/* Fixed */}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-secondary-neon" /> Type: <span className="font-semibold text-foreground capitalize">{userProfile.userType || "N/A"}</span> {/* Fixed */}
                  </p>
                  <Button variant="outline" className="w-full border-border text-primary-foreground hover:bg-muted" onClick={() => setIsEditing(true)}>
                    <Settings className="mr-2 h-4 w-4" /> Edit Private Details
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="wallet">
              <Card className="bg-card text-card-foreground shadow-lg border-border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-secondary-neon" /> Wallet Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-lg text-muted-foreground">Current Balance:</p>
                    <p className="text-2xl font-bold text-secondary-neon">₹{userProfile.walletBalance?.toFixed(2) ?? "0.00"}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-lg text-muted-foreground">Total Earned:</p>
                    <p className="text-xl font-semibold text-green-500">₹{userProfile.totalEarned?.toFixed(2) ?? "0.00"}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-lg text-muted-foreground">Total Spent:</p>
                    <p className="text-xl font-semibold text-red-500">₹{userProfile.totalSpent?.toFixed(2) ?? "0.00"}</p>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-destructive" />
                    <p className="text-sm">Dynamic Commission Rate: <span className="font-bold text-destructive">{dynamicCommissionRateDisplay}</span></p>
                  </div>
                  <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" onClick={() => navigate("/wallet")}>
                    View Full Wallet
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="policies">
              <Card className="bg-card text-card-foreground shadow-lg border-border">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-secondary-neon" /> Policies
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Review our policies regarding commissions, user conduct, data privacy, and more.
                  </p>
                  <Button variant="outline" className="w-full border-border text-primary-foreground hover:bg-muted" onClick={() => toast.info("Policies page coming soon!")}>
                    Read All Policies
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        {/* Developer Chatbox */}
        <DeveloperChatbox />

        {/* Logout Button */}
        <Button
          variant="destructive"
          className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" /> Log Out
        </Button>
      </div>
      <MadeWithDyad />

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Profile</DialogTitle>
          </DialogHeader>
          {userProfile && (
            <EditProfileForm
              initialData={{
                firstName: userProfile.firstName || '', // Fixed
                lastName: userProfile.lastName || '', // Fixed
                age: userProfile.age || 0, // Fixed
                mobileNumber: userProfile.mobileNumber || '',
                upiId: userProfile.upiId || '', // Fixed
                gender: userProfile.gender || 'prefer-not-to-say', // Fixed
                userType: userProfile.userType || 'student', // Fixed
              }}
              onSave={handleProfileUpdate}
              onCancel={() => setIsEditing(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileDetailsPage;