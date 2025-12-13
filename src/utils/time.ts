import { differenceInSeconds, addYears, intervalToDuration, isPast, Duration } from 'date-fns';

const GRADUATION_PERIOD_YEARS = 4; // 4 years for graduation

export interface GraduationData {
  progressPercentage: number;
  isGraduationProtocolActive: boolean;
  isGraduated: boolean;
  countdown: Duration;
}

export function getGraduationData(userCreationDate: string): GraduationData {
  const creationDate = new Date(userCreationDate);
  const graduationDate = addYears(creationDate, GRADUATION_PERIOD_YEARS);
  const protocolActivationDate = addYears(creationDate, GRADUATION_PERIOD_YEARS - 0.5); // 3.5 years mark

  const now = new Date();

  const totalDurationSeconds = differenceInSeconds(graduationDate, creationDate);
  const elapsedDurationSeconds = differenceInSeconds(now, creationDate);

  let progressPercentage = (elapsedDurationSeconds / totalDurationSeconds) * 100;
  progressPercentage = Math.max(0, Math.min(100, progressPercentage)); // Clamp between 0 and 100

  const isGraduated = isPast(graduationDate);
  const isGraduationProtocolActive = isPast(protocolActivationDate) && !isGraduated;

  let countdown: Duration;
  if (isGraduated) {
    countdown = { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  } else {
    countdown = intervalToDuration({ start: now, end: graduationDate });
  }

  return {
    progressPercentage,
    isGraduationProtocolActive,
    isGraduated,
    countdown,
  };
}

export function formatDuration(duration: Duration): string {
  const parts: string[] = [];
  if (duration.years && duration.years > 0) parts.push(`${duration.years}y`);
  if (duration.months && duration.months > 0) parts.push(`${duration.months}m`);
  if (duration.days && duration.days > 0) parts.push(`${duration.days}d`);
  if (duration.hours && parts.length < 2) parts.push(`${duration.hours}h`); // Only show hours if less than 2 larger units
  if (duration.minutes && parts.length < 2) parts.push(`${duration.minutes}m`); // Only show minutes if less than 2 larger units
  if (duration.seconds && parts.length < 2) parts.push(`${duration.seconds}s`); // Only show seconds if less than 2 larger units

  if (parts.length === 0) {
    return "Graduated!";
  }
  return parts.join(" ");
}