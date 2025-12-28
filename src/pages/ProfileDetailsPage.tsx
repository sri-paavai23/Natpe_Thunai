import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormControl } from '@/components/ui/form'; // Import FormControl
import { useAuth, UserPreferences } from '@/context/AuthContext';
import { getGraduationData } from '@/utils/dateUtils';
import { Mail, Phone, MapPin, Calendar, GraduationCap, Award, Code, Truck } from 'lucide-react';
import { toast } from 'sonner';

const ProfileDetailsPage = () => {
  const { user, userProfile, updateUserProfile } = useAuth();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editedName, setEditedName] = useState(userProfile?.name || user?.name || "");
  const [editedCollegeName, setEditedCollegeName] = useState(userProfile?.collegeName || "");
  const [editedYearOfStudy, setEditedYearOfStudy] = useState<UserPreferences['yearOfStudy']>(userProfile?.yearOfStudy || 'I');

  if (!user || !userProfile) {
    return <div className="container mx-auto p-4 text-center">Please log in to view your profile.</div>;
  }

  const userCreationDate = user.$createdAt; // Appwrite user creation date
  const graduationInfo = getGraduationData(userCreationDate, userProfile.yearOfStudy);
  const targetLevel = 25; // Example target level
  const levelsToGo = targetLevel - userProfile.level;
  const daysRemaining = graduationInfo.countdown.days;

  const handleSaveProfile = async () => {
    if (!updateUserProfile) {
      toast.error("Profile update function not available.");
      return;
    }
    try {
      await updateUserProfile({
        name: editedName,
        collegeName: editedCollegeName,
        yearOfStudy: editedYearOfStudy,
      });
      toast.success("Profile updated successfully!");
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile.");
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold text-foreground">My Profile</CardTitle>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Edit Profile</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                  Make changes to your profile here. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="collegeName" className="text-right">
                    College
                  </Label>
                  <Input
                    id="collegeName"
                    value={editedCollegeName}
                    onChange={(e) => setEditedCollegeName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="yearOfStudy" className="text-right">
                    Year of Study
                  </Label>
                  <Select value={editedYearOfStudy} onValueChange={(value: UserPreferences['yearOfStudy']) => setEditedYearOfStudy(value)}>
                    <FormControl>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select your year of study" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="I">First Year</SelectItem>
                      <SelectItem value="II">Second Year</SelectItem>
                      <SelectItem value="III">Third Year</SelectItem>
                      <SelectItem value="IV">Fourth Year</SelectItem>
                      <SelectItem value="V">Fifth Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSaveProfile}>Save changes</Button>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={userProfile.profilePictureUrl || "/avatars/01.png"} alt={user.name} /> {/* Corrected here */}
            <AvatarFallback>{user.name ? user.name[0] : 'U'}</AvatarFallback>
          </Avatar>
          <h2 className="text-3xl font-semibold text-foreground">{userProfile.name}</h2>
          <p className="text-muted-foreground mb-4">{user.email}</p>

          <div className="flex gap-2 mb-4">
            {userProfile.isDeveloper && <Badge className="bg-purple-500 hover:bg-purple-600"><Code className="h-3 w-3 mr-1" /> Developer</Badge>}
            {userProfile.isAmbassador && <Badge className="bg-green-500 hover:bg-green-600"><Truck className="h-3 w-3 mr-1" /> Ambassador</Badge>}
            <Badge variant="secondary">Level {userProfile.level}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" /> {userProfile.collegeName || "Not specified"}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4" /> {userProfile.yearOfStudy} Year
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" /> Joined: {new Date(user.$createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="h-4 w-4" /> Ambassador Deliveries: {userProfile.ambassadorDeliveriesCount}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Level Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              You are currently Level {userProfile.level}.
            </p>
            <Progress value={(userProfile.level / targetLevel) * 100} className="w-full mb-2" />
            <p className="text-xs text-muted-foreground">
              {levelsToGo > 0 ? `${levelsToGo} levels to go until Level ${targetLevel}!` : "You've reached the target level!"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Graduation Countdown</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Your estimated graduation date is {graduationInfo.graduationDate}.
            </p>
            <Progress value={graduationInfo.progress} className="w-full mb-2" />
            {graduationInfo.isGraduated ? (
              <p className="text-xs text-muted-foreground">Congratulations on your graduation!</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {graduationInfo.countdown.years > 0 && `${graduationInfo.countdown.years} years, `}
                {graduationInfo.countdown.months > 0 && `${graduationInfo.countdown.months} months, `}
                {graduationInfo.countdown.days} days remaining.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileDetailsPage;