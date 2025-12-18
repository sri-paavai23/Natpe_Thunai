"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/context/AuthContext";
import { Loader2, GraduationCap } from "lucide-react";
import { calculateGraduationData } from "@/utils/graduation";

const GraduationMeter: React.FC = () => {
  const { user, userProfile, isLoading: isAuthLoading, addXp } = useAuth();
  const userCreationDate = user?.$createdAt;

  const graduationData = userCreationDate ? calculateGraduationData(userCreationDate) : null;

  if (isAuthLoading || !userProfile || userProfile.role === "developer" || userProfile.userType === "staff" || !graduationData) {
    return null;
  }

  const { daysPassed, totalDays, percentage } = graduationData;

  const renderGraduationMotivation = () => {
    if (userProfile?.userType !== "student" || userProfile?.role === "developer") {
      return null;
    }

    if (percentage < 25) {
      return <p className="text-sm text-muted-foreground mt-2">The journey has just begun! Make the most of your time.</p>;
    }
    if (percentage < 50) {
      return <p className="text-sm text-muted-foreground mt-2">Halfway there! Keep pushing towards your goals.</p>;
    }
    if (percentage < 75) {
      return <p className="text-sm text-muted-foreground mt-2">The finish line is in sight! Stay focused and strong.</p>;
    }
    return <p className="text-sm text-muted-foreground mt-2">Almost there! Prepare for your next big adventure.</p>;
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-secondary-neon" /> Graduation Meter
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground">
          Days passed: <span className="font-semibold text-foreground">{daysPassed}</span> / <span className="font-semibold text-foreground">{totalDays}</span>
        </p>
        <div className="mt-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress: {percentage.toFixed(0)}%</span>
          </div>
          <Progress value={percentage} className="w-full h-2 mt-1 bg-muted" indicatorClassName="bg-secondary-neon" />
        </div>
        {renderGraduationMotivation()}
      </CardContent>
    </Card>
  );
};

export default GraduationMeter;