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

  const renderGraduationMotivation = () => {
    if (userProfile?.userType !== "student" || userProfile?.role === "developer") {
      return null;
    }

    const targetLevel = 25;
    const userLevel = userProfile.level;
    const levelsToGo = targetLevel - userLevel;
    const daysRemaining = countdown.totalDays; // Use totalDays for motivation logic

    if (isGraduated) {
      return null; // Already graduated, the main message handles it
    }

    if (userLevel >= targetLevel) {
      return (
        <p className="text-sm text-green-500 mt-2 font-semibold text-center">
          You've achieved Level {targetLevel}! You're well-prepared for your next chapter.
        </p>
      );
    }

    let motivationMessage = "";
    if (userLevel >= 1 && userLevel <= 5) {
      motivationMessage = "Welcome to the campus hustle! Every listing, every interaction, builds your rep. Aim for Level 25 to unlock sweet commission rates and become a campus legend!";
    } else if (userLevel >= 6 && userLevel <= 10) {
      motivationMessage = "You're getting the hang of it! Keep connecting, selling, and helping out. Level up to reduce those commission fees and make more from your grind!";
    } else if (userLevel >= 11 && userLevel <= 15) {
      motivationMessage = "Halfway to the top! Your influence is growing. Master new skills, offer more services, and watch that commission rate drop even further. You're building a legacy!";
    } else if (userLevel >= 16 && userLevel <= 20) {
      motivationMessage = "Almost there, champ! You're a key player in the campus economy. Push for Level 25 to secure the ultimate commission rate and truly thrive.";
    } else if (userLevel >= 21 && userLevel <= 24) {
      motivationMessage = "The finish line is in sight! Just a few more levels to become a true Campus Legend and lock in the lowest commission. Keep innovating, keep earning, and make your final year count!";
    }

    if (daysRemaining > 0 && levelsToGo > 0) {
      motivationMessage += ` You have approximately ${daysRemaining} days left before graduation.`;
    } else if (daysRemaining <= 0 && levelsToGo > 0) {
      motivationMessage += ` Time is running out! Focus on learning new skills to reach Level ${targetLevel}.`;
    }

    return (
      <p className="text-sm text-muted-foreground text-center mt-2">
        {motivationMessage}
      </p>
    );
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border overflow-hidden">
      <CardHeader className="p-4 pb-2 bg-gradient-to-r from-primary-blue-light to-secondary-neon text-primary-foreground">
        <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
          <GraduationCap className="h-6 w-6" /> Your Campus Journey
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-4 space-y-5 flex flex-col items-center text-center">
        {isGraduated ? (
          <div className="text-center text-destructive-foreground bg-destructive/10 p-4 rounded-lg w-full">
            <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-destructive" />
            <p className="font-bold text-xl text-destructive">Graduation Protocol Activated!</p>
            <p className="text-sm text-muted-foreground mt-2">Your account is scheduled for deletion. Please back up any important data.</p>
            <div className="mt-5 space-y-3">
              <Button onClick={handleExportData} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-200">
                <Download className="mr-2 h-4 w-4" /> Export My Data
              </Button>
              <Button onClick={handleConnectAlumni} variant="outline" className="w-full border-primary text-primary-foreground hover:bg-primary/10 transition-all duration-200">
                <Users className="mr-2 h-4 w-4" /> Connect with Alumni
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-2 w-full">
              <span className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-secondary-neon" /> Time Remaining:
              </span>
              <span className="text-3xl font-extrabold text-secondary-neon animate-pulse-slow">
                {countdownDisplay}
              </span>
            </div>
            <div className="w-full">
              <Progress
                value={progressPercentage}
                className="h-4 bg-muted-foreground/30 rounded-full shadow-inner"
                indicatorClassName={cn(progressColorClass, "transition-all duration-500 ease-out")}
              />
              <p className="text-xs text-muted-foreground mt-2">
                {isGraduationProtocolActive
                  ? "Graduation Protocol Active! Time to prepare for your next chapter."
                  : "Your journey continues. Keep engaging!"}
              </p>
            </div>
            {renderGraduationMotivation()}
            {isGraduationProtocolActive && (
              <div className="mt-5 space-y-3 w-full">
                <Button onClick={handleExportData} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200">
                  <Download className="mr-2 h-4 w-4" /> Export My Data
                </Button>
                <Button onClick={handleConnectAlumni} variant="outline" className="w-full border-primary text-primary-foreground hover:bg-primary/10 transition-all duration-200">
                  <Users className="mr-2 h-4 w-4" /> Connect with Alumni
                </Button>
                <Button onClick={handleCompleteChecklist} className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 transition-all duration-200">
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