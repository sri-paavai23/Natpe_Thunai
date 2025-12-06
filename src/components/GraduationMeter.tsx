"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, GraduationCap, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { APP_CREATION_DATE } from "@/lib/config";
import { getGraduationData, formatDuration } from "@/utils/time";
import { cn } from "@/lib/utils";

const GraduationMeter: React.FC = () => {
  const { userProfile, isLoading: isAuthLoading } = useAuth();
  const [graduationData, setGraduationData] = useState(getGraduationData(APP_CREATION_DATE));

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setGraduationData(getGraduationData(APP_CREATION_DATE));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Don't render for developers or staff
  if (isAuthLoading || !userProfile || userProfile.role === "developer" || userProfile.userType === "staff") {
    return null;
  }

  const {
    progressPercentage,
    isGraduationProtocolActive,
    isGraduated,
    countdown,
  } = graduationData;

  const progressColorClass = isGraduationProtocolActive
    ? "bg-orange-500" // Urgent color
    : "bg-secondary-neon"; // Normal color

  const countdownDisplay = formatDuration(countdown);

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-secondary-neon" /> Graduation Meter
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {isGraduated ? (
          <div className="text-center text-destructive-foreground bg-destructive/10 p-3 rounded-md">
            <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-destructive" />
            <p className="font-bold text-lg text-destructive">Graduation Protocol Activated!</p>
            <p className="text-sm text-muted-foreground">Your account is scheduled for deletion. Please back up any important data.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> Time Remaining:
              </span>
              <span className="font-bold text-foreground">{countdownDisplay}</span>
            </div>
            <Progress
              value={progressPercentage}
              className="h-3 bg-muted-foreground/30"
              indicatorClassName={progressColorClass}
            />
            <p className="text-xs text-muted-foreground text-center">
              {isGraduationProtocolActive
                ? "Graduation Protocol Active! Time to prepare for your next chapter."
                : "Your journey continues. Keep engaging!"}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GraduationMeter;