import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { User, Award, Code, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ProfileWidget = () => {
  const { user, userProfile, isLoading } = useAuth(); // Use userProfile and isLoading

  if (isLoading || !user || !userProfile) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium">My Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center text-center">
          <User className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">My Profile</CardTitle>
        <User className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="flex flex-col items-center text-center">
        <Avatar className="h-16 w-16 mb-2">
          <AvatarImage src={userProfile.profilePictureUrl || "/avatars/01.png"} alt={userProfile.name} />
          <AvatarFallback>{userProfile.name ? userProfile.name[0] : 'U'}</AvatarFallback>
        </Avatar>
        <h3 className="text-lg font-semibold">{userProfile.name}</h3>
        <p className="text-xs text-muted-foreground">{userProfile.collegeName || "College not set"}</p>
        <div className="flex gap-1 mt-2">
          <Badge variant="secondary">Level {userProfile.level}</Badge>
          {userProfile.isDeveloper && <Badge className="bg-purple-500 hover:bg-purple-600"><Code className="h-3 w-3 mr-1" /> Dev</Badge>}
          {userProfile.isAmbassador && <Badge className="bg-green-500 hover:bg-green-600"><Truck className="h-3 w-3 mr-1" /> Amb</Badge>}
        </div>
        <Button asChild variant="link" className="mt-2">
          <Link to="/profile">View Profile</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileWidget;