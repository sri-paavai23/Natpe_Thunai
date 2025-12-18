// src/utils/graduation.ts
// This utility calculates a user's progress towards graduation based on their account creation date.

interface GraduationData {
  daysPassed: number;
  totalDays: number;
  percentage: number;
}

export const calculateGraduationData = (userCreationDate: string): GraduationData => {
  const creationDate = new Date(userCreationDate);
  const today = new Date();

  // Assuming a 4-year (approx 1460 days) degree program for simplicity
  const totalDegreeDays = 4 * 365; // Roughly 4 years

  const diffTime = Math.abs(today.getTime() - creationDate.getTime());
  const daysPassed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const percentage = Math.min((daysPassed / totalDegreeDays) * 100, 100); // Cap at 100%

  return {
    daysPassed: daysPassed,
    totalDays: totalDegreeDays,
    percentage: percentage,
  };
};