export interface Countdown {
  years: number;
  months: number;
  days: number; // Keeping for internal calculation, not directly used in requested format
  hours: number; // Keeping for internal calculation, not directly used in requested format
  minutes: number;
  seconds: number;
  totalDays: number; // Total days remaining
}

export interface GraduationData {
  progressPercentage: number;
  isGraduationProtocolActive: boolean;
  isGraduated: boolean;
  countdown: Countdown;
}

/**
 * Calculates graduation data based on user creation date.
 * Assumes a 4-year graduation timeline.
 * @param userCreationDateString The user's account creation date as a string.
 * @returns GraduationData object containing progress, status, and countdown.
 */
export const getGraduationData = (userCreationDateString: string): GraduationData => {
  const now = new Date();
  const userCreationDate = new Date(userCreationDateString);

  // Calculate 4 years from creation date for the actual graduation date
  const graduationDate = new Date(userCreationDate);
  graduationDate.setFullYear(graduationDate.getFullYear() + 4);

  // Calculate 3.5 years from creation date for protocol activation
  const protocolDate = new Date(userCreationDate);
  protocolDate.setFullYear(protocolDate.getFullYear() + 3);
  protocolDate.setMonth(protocolDate.getMonth() + 6); // Add 6 months for .5 year

  let remainingDurationMs = graduationDate.getTime() - now.getTime();
  if (remainingDurationMs < 0) remainingDurationMs = 0;

  const totalDurationMs = graduationDate.getTime() - userCreationDate.getTime();
  let progressPercentage = (1 - (remainingDurationMs / totalDurationMs)) * 100;
  if (progressPercentage < 0) progressPercentage = 0;
  if (progressPercentage > 100) progressPercentage = 100;

  const isGraduated = remainingDurationMs <= 0;
  const isGraduationProtocolActive = now.getTime() >= protocolDate.getTime() && !isGraduated;

  // Calculate countdown components
  const totalSeconds = Math.floor(remainingDurationMs / 1000);
  const currentSeconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const currentMinutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const currentHours = totalHours % 24; // Hours within the current day
  const totalDays = Math.floor(totalHours / 24);

  // Approximate years and months from totalDays for display
  const years = Math.floor(totalDays / 365);
  const remainingDaysAfterYears = totalDays % 365;
  const months = Math.floor(remainingDaysAfterYears / 30); // Approximate 30 days per month
  const days = remainingDaysAfterYears % 30; // Remaining days after approximating months

  const countdown: Countdown = {
    years,
    months,
    days,
    hours: currentHours,
    minutes: currentMinutes,
    seconds: currentSeconds,
    totalDays,
  };

  return {
    progressPercentage,
    isGraduationProtocolActive,
    isGraduated,
    countdown,
  };
};

/**
 * Formats the countdown object into a human-readable string.
 * Displays in "X years Y months Z minutes A seconds" format.
 * @param countdown The Countdown object.
 * @returns Formatted duration string.
 */
export const formatDuration = (countdown: Countdown): string => {
  if (countdown.totalDays <= 0 && countdown.hours <= 0 && countdown.minutes <= 0 && countdown.seconds <= 0) {
    return "Graduated!";
  }

  const parts: string[] = [];
  if (countdown.years > 0) {
    parts.push(`${countdown.years} year${countdown.years !== 1 ? 's' : ''}`);
  }
  if (countdown.months > 0) {
    parts.push(`${countdown.months} month${countdown.months !== 1 ? 's' : ''}`);
  }
  // Per your request, we are skipping days and hours in the output string.
  if (countdown.minutes > 0) {
    parts.push(`${countdown.minutes} minute${countdown.minutes !== 1 ? 's' : ''}`);
  }
  // Always show seconds if it's the only remaining part, or if it's greater than 0.
  if (countdown.seconds > 0 || parts.length === 0) { 
    parts.push(`${countdown.seconds} second${countdown.seconds !== 1 ? 's' : ''}`);
  }

  if (parts.length === 0) {
    return "0 seconds"; // Fallback for very small durations
  }

  // Join parts with commas, and "and" before the last part
  if (parts.length > 1) {
    const lastPart = parts.pop();
    return `${parts.join(', ')} and ${lastPart}`;
  }
  return parts[0];
};