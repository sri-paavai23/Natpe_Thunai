// src/utils/commission.ts

/**
 * Calculates the dynamic commission rate based on the user's level.
 * Commission starts at 11.32% (Level 1) and decreases gradually based on defined breakpoints.
 * @param level The user's current level (must be >= 1).
 * @returns The commission rate as a percentage (e.g., 0.1132 for 11.32%).
 */
export const calculateCommissionRate = (level: number): number => {
  const START_RATE = 0.1132; // 11.32% at Level 1
  const MIN_RATE = 0.0534; // 5.34% (absolute floor)
  const MAX_LEVEL_FOR_MIN_RATE = 100; // Assuming minimum rate is reached at Level 100

  if (level <= 1) {
    return START_RATE;
  }
  if (level >= MAX_LEVEL_FOR_MIN_RATE) {
    return MIN_RATE;
  }

  // Define breakpoints (level, rate)
  const breakpoints = [
    { level: 1, rate: START_RATE },
    { level: 7, rate: 0.1036 }, // 10.36%
    { level: 20, rate: 0.1000 }, // 10.00%
    { level: 50, rate: 0.0800 }, // 8.00%
    { level: MAX_LEVEL_FOR_MIN_RATE, rate: MIN_RATE },
  ];

  // Find the segment the current level falls into
  for (let i = 0; i < breakpoints.length - 1; i++) {
    const p1 = breakpoints[i];
    const p2 = breakpoints[i + 1];

    if (level >= p1.level && level < p2.level) {
      // Linear interpolation within this segment
      const levelRange = p2.level - p1.level;
      const rateRange = p1.rate - p2.rate; // Rate decreases
      const reductionPerLevel = rateRange / levelRange;
      
      return p1.rate - (level - p1.level) * reductionPerLevel;
    }
  }

  // Fallback, should not be reached if level is handled by initial checks or loop
  return MIN_RATE;
};

/**
 * Formats the commission rate as a percentage string (e.g., '11.32%').
 * @param rate The commission rate (e.g., 0.1132).
 * @returns Formatted string.
 */
export const formatCommissionRate = (rate: number): string => {
  return (rate * 100).toFixed(2) + '%';
};