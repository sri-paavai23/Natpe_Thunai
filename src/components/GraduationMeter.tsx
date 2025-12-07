"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, GraduationCap, AlertTriangle, Download, Users, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getGraduationData, formatDuration } from "@/utils/time";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const GraduationMeter: React.FC = () => {
  const { user, userProfile, isLoading: isAuthLoading, addXp } = useAuth();
  const userCreationDate = user?.$createdAt;

  const [graduationData, setGraduationData] = useState(() => 
    userCreationDate ? getGraduationData(userCreationDate) : null
  );

  // Refs to track if notifications have been shown
  const protocolNotificationShown = useRef(false);
  const graduatedNotificationShown = useRef(false);

  // Update countdown every second
  useEffect(() => {
    if (!userCreationDate) return;

    const interval = setInterval(() => {
      setGraduationData(getGraduationData(userCreationDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [userCreationDate]);

  // Handle notifications based on state changes
  useEffect(() => {
    if (!graduationData) return;

    if (graduationData.isGraduationProtocolActive && !protocolNotificationShown.current) {
      toast.warning("Graduation Protocol Active! You are 3.5 years into your journey. Time to prepare for your next chapter.");
      protocolNotificationShown.current = true;
    }

    if (graduationData.isGraduated && !graduatedNotificationShown.current) {
      toast.error("Graduation Protocol Activated! Your account is scheduled for deletion. Please back up any important data.");
      graduatedNotificationShown.current = true;
    }
  }, [graduationData]);

  // Don't render for developers or staff, or if user data isn't loaded yet
  if (isAuthLoading || !userProfile || userProfile.role === "developer" || userProfile.userType === "staff" || !graduationData) {
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

  const handleExportData = () => {
    toast.info("Simulating data export... (Feature under development)");
    // In a real app, trigger a data export function
  };

  const handleConnectAlumni = () => {
    toast.info("Simulating connection to alumni network... (Feature under development)");
    // In a real app, navigate to an alumni portal or connect with relevant users
  };

  const handleCompleteChecklist = () => {
    if (addXp) {
      addXp(100); // Reward 100 XP for completing the checklist
      toast.success("Graduation Checklist Completed! +100 XP earned. Keep preparing for your next step!");
    } else {
      toast.error("Failed to add XP. Please try again.");
    }
  };

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
            <div className="mt-4 space-y-2">
              <Button onClick={handleExportData} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <Download className="mr-2 h-4 w-4" /> Export My Data
              </Button>
              <Button onClick={handleConnectAlumni} variant="outline" className="w-full border-primary text-primary-foreground hover:bg-primary/10">
                <Users className="mr-2 h-4 w-4" /> Connect with Alumni
              </Button>
            </div>
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
            {isGraduationProtocolActive && (
              <div className="mt-4 space-y-2">
                <Button onClick={handleExportData} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Download className="mr-2 h-4 w-4" /> Export My Data
                </Button>
                <Button onClick={handleConnectAlumni} variant="outline" className="w-full border-primary text-primary-foreground hover:bg-primary/10">
                  <Users className="mr-2 h-4 w-4" /> Connect with Alumni
                </Button>
                <Button onClick={handleCompleteChecklist} className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                  <CheckCircle className="mr-2 h-4 w-4" /> Complete Graduation Checklist (+100 XP)
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GraduationMeter;