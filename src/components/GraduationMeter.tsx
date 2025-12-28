import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getGraduationData } from '@/utils/dateUtils';

const GraduationMeter = () => {
  const { user, userProfile, isLoading } = useAuth(); // Use userProfile and isLoading

  if (isLoading || !user || !userProfile) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Graduation Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Loading...</div>
          <p className="text-xs text-muted-foreground">Please log in to see your progress.</p>
        </CardContent>
      </Card>
    );
  }

  const userCreationDate = user.$createdAt;
  const graduationInfo = getGraduationData(userCreationDate, userProfile.yearOfStudy);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Graduation Progress</CardTitle>
        <GraduationCap className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">
          {graduationInfo.isGraduated ? "Graduated!" : `${graduationInfo.countdown.years}y ${graduationInfo.countdown.months}m ${graduationInfo.countdown.days}d`}
        </div>
        <Progress value={graduationInfo.progress} className="w-full mb-2" />
        <p className="text-xs text-muted-foreground">
          {graduationInfo.isGraduated ? "Congratulations!" : `Estimated: ${graduationInfo.graduationDate}`}
        </p>
      </CardContent>
    </Card>
  );
};

export default GraduationMeter;