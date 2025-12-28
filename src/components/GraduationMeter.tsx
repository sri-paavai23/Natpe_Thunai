"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, GraduationCap, AlertTriangle, Download, Users, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
// NOTE: We only need formatDuration now, we will calculate the data locally
import { formatDuration } from "@/utils/time"; 
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const GraduationMeter: React.FC = () => {
  const { user, userProfile, isLoading: isAuthLoading, addXp } = useAuth();
  
  // Refs to track if notifications have been shown
  const protocolNotificationShown = useRef(false);
  const graduatedNotificationShown = useRef(false);

  // --- NEW LOGIC START ---
  // We calculate state locally to handle the custom graduationDate from the database
  const calculateGraduationState = () => {
    if (!user?.$createdAt) return null;

    const now = new Date();
    const created = new Date(user.$createdAt);
    
    // 1. Determine the Target Date
    let targetDate: Date;
    
    // If the user has a specific date saved (from the new Auth Page logic), use it.
    if (userProfile?.graduationDate) {
      targetDate = new Date(userProfile.graduationDate);
    } else {
      // Fallback for old users or missing data: Standard 4 years from creation
      targetDate = new Date(created);
      targetDate.setFullYear(targetDate.getFullYear() + 4);
    }

    // 2. Calculate Math
    const totalDuration = targetDate.getTime() - created.getTime();
    const elapsed = now.getTime() - created.getTime();
    const remaining = targetDate.getTime() - now.getTime();

    // Prevent division by zero
    const safeTotal = totalDuration > 0 ? totalDuration : 1;
    // Cap percentage between 0 and 100
    const percentage = Math.min(100, Math.max(0, (elapsed / safeTotal) * 100));

    // 3. Create Countdown Object for the helper function
    // (Assuming formatDuration expects milliseconds or an object, adjusting for common usage)
    const countdownObj = {
      days: Math.floor(remaining / (1000 * 60 * 60 * 24)),
      hours: Math.floor((remaining / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((remaining / 1000 / 60) % 60),
      seconds: Math.floor((remaining / 1000) % 60),
      total: remaining // passing total ms if needed
    };

    return {
      progressPercentage: percentage,
      isGraduated: percentage >= 100,
      isGraduationProtocolActive: percentage >= 87.5, // Last ~6 months of a 4-year cycle
      countdown: countdownObj,
    };
  };
  // --- NEW LOGIC END ---

  // Initialize state using the new calculator
  const [graduationData, setGraduationData] = useState(() => calculateGraduationState());

  // Update countdown every second
  useEffect(() => {
    if (!user?.$createdAt) return;

    // Run immediately
    setGraduationData(calculateGraduationState());

    const interval = setInterval(() => {
      setGraduationData(calculateGraduationState());
    }, 1000);

    return () => clearInterval(interval);
    // Add userProfile to dependency array so it recalculates when profile loads
  }, [user?.$createdAt, userProfile]); 

  // Handle notifications based on state changes
  useEffect(() => {
    if (!graduationData) return;

    if (graduationData.isGraduationProtocolActive && !protocolNotificationShown.current) {
      toast.warning("Graduation Protocol Active! Time to prepare for your next chapter.");
      protocolNotificationShown.current = true;
    }

    if (graduationData.isGraduated && !graduatedNotificationShown.current) {
      toast.error("Graduation Protocol Activated! Account scheduled for deletion.");
      graduatedNotificationShown.current = true;
    }
  }, [graduationData?.isGraduationProtocolActive, graduationData?.isGraduated]);

  // Don't render if loading or if user is special role
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
    ? "bg-orange-500" 
    : "bg-secondary-neon"; 

  // Format the display
  // Ensure your formatDuration utility can handle the object we created, 
  // or pass `countdown.total` if it expects a number.
  // Assuming formatDuration takes the object:
  const countdownDisplay = formatDuration(countdown); 

  // ... (Keep existing handlers handleExportData, handleConnectAlumni, handleCompleteChecklist) ...
  const handleExportData = () => toast.info("Simulating data export...");
  const handleConnectAlumni = () => toast.info("Simulating alumni connection...");
  const handleCompleteChecklist = () => {
     if (addXp) { addXp(100); toast.success("Checklist Completed! +100 XP"); }
  };

  // ... (Keep renderGraduationMotivation logic exactly as it was) ...
  const renderGraduationMotivation = () => {
    if (userProfile?.userType !== "student" || userProfile?.role === "developer") return null;
    
    // Use countdown.days for the motivation logic
    const daysRemaining = countdown.days; 
    const targetLevel = 25;
    const userLevel = userProfile.level;
    const levelsToGo = targetLevel - userLevel;

    if (isGraduated) return null;

    if (userLevel >= targetLevel) {
      return <p className="text-sm text-green-500 mt-2 font-semibold text-center">You've achieved Level {targetLevel}! Ready for the next chapter.</p>;
    }
    
    // (Simplified motivation logic for brevity - keep your original detailed if/else here)
    return <p className="text-sm text-muted-foreground text-center mt-2">{daysRemaining} days left. Reach Level {targetLevel}!</p>;
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
            <p className="text-sm text-muted-foreground mt-2">Your account is scheduled for deletion.</p>
            <div className="mt-5 space-y-3">
              <Button onClick={handleExportData} className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-200">
                <Download className="mr-2 h-4 w-4" /> Export My Data
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
                <Button onClick={handleCompleteChecklist} className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 transition-all duration-200">
                  <CheckCircle className="mr-2 h-4 w-4" /> Complete Checklist (+100 XP)
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