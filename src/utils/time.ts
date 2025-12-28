"use client";

import { DateTime } from 'luxon';

interface CountdownDuration {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
  milliseconds: number;
}

interface GraduationData {
  progressPercentage: number;
  isGraduationProtocolActive: boolean;
  isGraduated: boolean;
  countdown: CountdownDuration;
}

export const getGraduationData = (userCreationDate: string, currentStudyYear: string = "I"): GraduationData => {
  const creationDateTime = DateTime.fromISO(userCreationDate);
  let yearsToAdd: number;

  switch (currentStudyYear) {
    case "I":
      yearsToAdd = 4; // 3 years and 12 months
      break;
    case "II":
      yearsToAdd = 3; // 2 years and 12 months
      break;
    case "III":
      yearsToAdd = 2; // 1 year and 12 months
      break;
    case "IV":
    case "V":
    case "Other":
      yearsToAdd = 1; // 12 months
      break;
    default:
      yearsToAdd = 4; // Default to 4 years if not specified or invalid
  }

  const targetGraduationDate = creationDateTime.plus({ years: yearsToAdd });

  const now = DateTime.now();
  const diff = targetGraduationDate.diff(now, ["years", "months", "days", "hours", "minutes", "seconds"]);

  const totalDurationInMilliseconds = targetGraduationDate.diff(creationDateTime, "milliseconds").milliseconds;
  const elapsedDurationInMilliseconds = now.diff(creationDateTime, "milliseconds").milliseconds;

  let progressPercentage = (elapsedDurationInMilliseconds / totalDurationInMilliseconds) * 100;
  progressPercentage = Math.max(0, Math.min(100, progressPercentage));

  const isGraduated = diff.milliseconds <= 0;
  const isGraduationProtocolActive = diff.milliseconds > 0 && diff.as("months") <= 6;

  const countdownYears = Math.max(0, Math.floor(diff.years));
  const countdownMonths = Math.max(0, Math.floor(diff.months % 12));
  const countdownDays = Math.max(0, Math.floor(diff.days));
  const countdownHours = Math.max(0, Math.floor(diff.hours));
  const countdownMinutes = Math.max(0, Math.floor(diff.minutes));
  const countdownSeconds = Math.max(0, Math.floor(diff.seconds));
  const totalDaysRemaining = Math.max(0, Math.floor(diff.as("days")));


  return {
    progressPercentage,
    isGraduationProtocolActive,
    isGraduated,
    countdown: {
      years: countdownYears,
      months: countdownMonths,
      days: countdownDays,
      hours: countdownHours,
      minutes: countdownMinutes,
      seconds: countdownSeconds,
      totalDays: totalDaysRemaining,
      milliseconds: diff.milliseconds,
    },
  };
};

export const formatDuration = (duration: CountdownDuration): string => {
  const parts = [];
  if (duration.years > 0) parts.push(`${duration.years}y`);
  if (duration.months > 0) parts.push(`${duration.months}m`);
  if (duration.days > 0) parts.push(`${duration.days}d`);
  if (duration.hours > 0) parts.push(`${duration.hours}h`);
  if (duration.minutes > 0) parts.push(`${duration.minutes}m`);
  if (duration.seconds > 0) parts.push(`${duration.seconds}s`);

  if (parts.length === 0) return "0s";
  return parts.join(" ");
};