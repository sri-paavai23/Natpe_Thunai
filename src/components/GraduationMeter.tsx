"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, GraduationCap, AlertTriangle, Download, Users, CheckCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const GraduationMeter: React.FC = () => {
  const { user, userProfile, isLoading: isAuthLoading, addXp } = useAuth();
  
  const protocolNotificationShown = useRef(false);
  const graduatedNotificationShown = useRef(false);

  // --- LOGIC: Custom Calculation Engine ---
  const calculateGraduationState = () => {
    if (!user?.$createdAt) return null;

    const now = new Date();
    const created = new Date(user.$createdAt);
    
    // 1. Determine Target Date (Logic from previous steps)
    let targetDate: Date;
    
    // Cast to 'any' to bypass TS error until UserProfile type is updated globally
    if ((userProfile as any)?.graduationDate) {
      targetDate = new Date((userProfile as any).graduationDate);
    } else {
      // Fallback: 4 years from creation
      targetDate = new Date(created);
      targetDate.setFullYear(targetDate.getFullYear() + 4);
    }

    // 2. Calculate Total Remaining Milliseconds
    const totalDuration = targetDate.getTime() - created.getTime();
    const elapsed = now.getTime() - created.getTime();
    let remaining = targetDate.getTime() - now.getTime();

    // Prevent negative time
    if (remaining < 0) remaining = 0;

    // 3. Break down milliseconds into Units
    // Constants
    const msYear = 1000 * 60 * 60 * 24 * 365;
    const msMonth = 1000 * 60 * 60 * 24 * 30; // Approx 30 days
    const msDay = 1000 * 60 * 60 * 24;
    const msHour = 1000 * 60 * 60;
    const msMinute = 1000 * 60;
    const msSecond = 1000;

    // Calculations
    const years = Math.floor(remaining / msYear);
    remaining %= msYear;

    const months = Math.floor(remaining / msMonth);
    remaining %= msMonth;

    const days = Math.floor(remaining / msDay);
    remaining %= msDay;

    const hours = Math.floor(remaining / msHour);
    remaining %= msHour;

    const minutes = Math.floor(remaining / msMinute);
    remaining %= msMinute;

    const seconds = Math.floor(remaining / msSecond);

    // Percentage Calculation
    const safeTotal = totalDuration > 0 ? totalDuration : 1;
    const percentage = Math.min(100, Math.max(0, (elapsed / safeTotal) * 100));

    return {
      progressPercentage: percentage,
      isGraduated: percentage >= 100,
      isGraduationProtocolActive: percentage >= 87.5,
      // Object containing broken down units
      countdown: {
        years,
        months,
        days,
        hours,
        minutes,
        seconds,
        totalDays: Math.floor((targetDate.getTime() - now.getTime()) / msDay) // For motivation text
      },
    };
  };

  const [graduationData, setGraduationData] = useState(() => calculateGraduationState());

  // Update loop
  useEffect(() => {
    if (!user?.$createdAt) return;

    setGraduationData(calculateGraduationState()); // Initial run

    const interval = setInterval(() => {
      setGraduationData(calculateGraduationState());
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.$createdAt, (userProfile as any)?.graduationDate]); 

  // Notification Logic
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

  if (isAuthLoading || !userProfile || userProfile.role === "developer" || userProfile.userType === "staff" || !graduationData) {
    return null;
  }

  const {
    progressPercentage,
    isGraduationProtocolActive,
    isGraduated,
    countdown,
  } = graduationData;

  // --- CUSTOM DISPLAY FORMATTER ---
  // Returns string: "2 Yrs 3 Mos 12 Days 45 Secs"
  const getFormattedString = () => {
    const parts = [];
    
    if (countdown.years > 0) parts.push(`${countdown.years} Yr${countdown.years > 1 ? 's' : ''}`);
    if (countdown.months > 0) parts.push(`${countdown.months} Mo${countdown.months > 1 ? 's' : ''}`);
    if (countdown.days > 0) parts.push(`${countdown.days} Day${countdown.days > 1 ? 's' : ''}`);
    
    // Always show seconds for "liveness", or Hours if it's getting close
    if (parts.length < 2) { 
        // If we only have days (e.g. 0 years 0 months), add hours
        parts.push(`${countdown.hours} Hr${countdown.hours > 1 ? 's' : ''}`);
    }
    
    // Add seconds at the end for the ticking effect
    parts.push(`${countdown.seconds} Sec${countdown.seconds > 1 ? 's' : ''}`);

    return parts.join(" ");
  };

  const countdownDisplay = getFormattedString();
  
  const progressColorClass = isGraduationProtocolActive
    ? "bg-orange-500" 
    : "bg-secondary-neon"; 

  const handleExportData = () => toast.info("Simulating data export...");
  const handleConnectAlumni = () => toast.info("Simulating alumni connection...");
  const handleCompleteChecklist = () => {
     if (addXp) { addXp(100); toast.success("Checklist Completed! +100 XP"); }
  };

  const renderGraduationMotivation = () => {
    if (userProfile?.userType !== "student" || userProfile?.role === "developer") return null;
    
    const daysRemaining = countdown.totalDays; 
    const targetLevel = 25;
    const userLevel = userProfile.level;
    
    if (isGraduated) return null;

    if (userLevel >= targetLevel) {
      return <p className="text-sm text-green-500 mt-2 font-semibold text-center">You've achieved Level {targetLevel}! Ready for the next chapter.</p>;
    }
    
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
              {/* Reduced font size slightly to fit the longer string */}
              <span className="text-xl sm:text-2xl font-extrabold text-secondary-neon animate-pulse-slow break-words text-center">
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