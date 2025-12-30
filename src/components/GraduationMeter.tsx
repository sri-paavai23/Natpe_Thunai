import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from '@/context/AuthContext';
import { Loader2, GraduationCap } from 'lucide-react';
import { differenceInDays, addYears, parseISO } from 'date-fns';

const APP_CREATION_DATE_ISO = import.meta.env.VITE_APP_CREATION_DATE as string; // From .env

const GraduationMeter: React.FC = () => {
  const { user, userProfile, loading: isAuthLoading, addXp } = useAuth(); // Corrected 'isLoading' to 'loading'

  if (isAuthLoading) {
    return (
      <Card className="bg-card border-border-dark text-foreground">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Graduation Meter</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
        </CardContent>
      </Card>
    );
  }

  if (!user || !userProfile || userProfile.userType !== 'student') {
    return null; // Only show for logged-in students
  }

  const appCreationDate = parseISO(APP_CREATION_DATE_ISO);
  const graduationDate = addYears(appCreationDate, 4);
  const totalDays = differenceInDays(graduationDate, appCreationDate);
  const daysPassed = differenceInDays(new Date(), appCreationDate);
  const progressPercentage = Math.min(100, (daysPassed / totalDays) * 100);

  const daysRemaining = differenceInDays(graduationDate, new Date());

  return (
    <Card className="bg-card border-border-dark text-foreground">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center">
          <GraduationCap className="h-5 w-5 mr-2 text-secondary-neon" /> Graduation Meter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          You're on track to graduate! Your account will be automatically archived 4 years from the app's launch date.
        </p>
        <Progress value={progressPercentage} className="w-full h-2 bg-border-dark" indicatorClassName="bg-secondary-neon" />
        <p className="text-sm text-muted-foreground">
          {daysRemaining > 0 ? `${daysRemaining} days until graduation!` : "Congratulations! You've graduated!"}
        </p>
      </CardContent>
    </Card>
  );
};

export default GraduationMeter;