"use client";

import { differenceInSeconds, addYears, addMonths, addDays, format, intervalToDuration } from 'date-fns';

interface GraduationData {
  totalDurationSeconds: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  progressPercentage: number;
  isGraduationProtocolActive: boolean; // After 3.5 years
  isGraduated: boolean; // After 4 years
  countdown: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
}

/**
 * Calculates the graduation meter data based on a given start date.
 * @param startDateString The ISO string of the user's account creation date (e.g., '2024-01-01T00:00:00Z').
 * @returns GraduationData object.
 */
export const getGraduationData = (startDateString: string): GraduationData => {
  const startDate = new Date(startDateString);
  const now = new Date();

  const fourYearsLater = addYears(startDate, 4);
  const threePointFiveYearsLater = addMonths(addYears(startDate, 3), 6); // 3 years and 6 months

  const totalDurationSeconds = differenceInSeconds(fourYearsLater, startDate);
  const elapsedSeconds = differenceInSeconds(now, startDate);
  const remainingSeconds = differenceInSeconds(fourYearsLater, now);

  const progressPercentage = Math.max(0, Math.min(100, (elapsedSeconds / totalDurationSeconds) * 100));

  const isGraduationProtocolActive = now >= threePointFiveYearsLater && now < fourYearsLater;
  const isGraduated = now >= fourYearsLater;

  const duration = intervalToDuration({ start: now, end: fourYearsLater });

  return {
    totalDurationSeconds,
    elapsedSeconds: Math.max(0, elapsedSeconds),
    remainingSeconds: Math.max(0, remainingSeconds),
    progressPercentage,
    isGraduationProtocolActive,
    isGraduated,
    countdown: {
      days: Math.max(0, duration.days || 0),
      hours: Math.max(0, duration.hours || 0),
      minutes: Math.max(0, duration.minutes || 0),
      seconds: Math.max(0, duration.seconds || 0),
    },
  };
};

/**
 * Formats a duration object into a human-readable string.
 * @param duration The duration object from date-fns.
 * @returns Formatted string (e.g., "123d 10h 30m 15s").
 */
export const formatDuration = (duration: { days: number; hours: number; minutes: number; seconds: number }): string => {
  const parts = [];
  if (duration.days > 0) parts.push(`${duration.days}d`);
  if (duration.hours > 0) parts.push(`${duration.hours}h`);
  if (duration.minutes > 0) parts.push(`${duration.minutes}m`);
  if (duration.seconds > 0 || parts.length === 0) parts.push(`${duration.seconds}s`); // Always show seconds if nothing else, or if it's the last part
  return parts.join(' ');
};