"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Clock, GraduationCap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const FOUR_YEARS_IN_MS = 4 * 365.25 * 24 * 60 * 60 * 1000; // Account for leap years
const THREE_POINT_FIVE_YEARS_IN_MS = 3.5 * 365.25 * 24 * 60 * 60 * 1000;

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const GraduationCountdown: React.FC = () => {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [isGraduationProtocolActive, setIsGraduationProtocolActive] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const calculateTimeAndProgress = useCallback(() => {
    if (!user?.$createdAt) return;

    const accountCreationDate = new Date(user.$createdAt).getTime();
    const graduationDate = accountCreationDate + FOUR_YEARS_IN_MS;
    const now = Date.now();

    const remainingTime = graduationDate - now;
    const elapsedTime = now - accountCreationDate;

    if (remainingTime <= 0) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setProgressPercentage(100);
      setIsGraduationProtocolActive(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);

    setTimeLeft({ days, hours, minutes, seconds });

    const progress = (elapsedTime / FOUR_YEARS_IN_MS) * 100;
    setProgressPercentage(Math.min(100, Math.max(0, progress))); // Clamp between 0 and 100

    setIsGraduationProtocolActive(elapsedTime >= THREE_POINT_FIVE_YEARS_IN_MS);
  }, [user?.$createdAt]);

  useEffect(() => {
    calculateTimeAndProgress(); // Initial calculation

    intervalRef.current = window.setInterval(calculateTimeAndProgress, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [calculateTimeAndProgress]);

  if (!user?.$createdAt) {
    return null; // Don't render if user creation date is not available
  }

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-secondary-neon" /> Graduation Countdown
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Time until account deletion:</p>
          <div className="flex justify-center items-baseline space-x-2 font-mono text-2xl font-bold text-foreground">
            <span>{timeLeft.days}D</span>
            <span>{timeLeft.hours}H</span>
            <span>{timeLeft.minutes}M</span>
            <span>{timeLeft.seconds}S</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Account Created</span>
            <span>Graduation Protocol {isGraduationProtocolActive ? "Active" : "Inactive"}</span>
          </div>
          <Progress
            value={progressPercentage}
            className={cn(
              "h-3",
              isGraduationProtocolActive
                ? "[&::-webkit-progress-bar]:bg-orange-500 [&::-webkit-progress-value]:bg-orange-500"
                : "[&::-webkit-progress-bar]:bg-secondary-neon [&::-webkit-progress-value]:bg-secondary-neon"
            )}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        {isGraduationProtocolActive && (
          <div className="text-center text-sm text-orange-500 font-semibold">
            Warning: Graduation Protocol is active! Your account will be deleted soon.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GraduationCountdown;