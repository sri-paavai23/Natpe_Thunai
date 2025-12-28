import { differenceInDays, parseISO, addYears, format, isPast } from 'date-fns';

interface GraduationData {
  graduationDate: string;
  remainingDays: number;
  totalDays: number;
  progress: number;
  isGraduated: boolean;
  countdown: {
    years: number;
    months: number;
    days: number;
  };
}

export const getGraduationData = (userCreationDate: string, yearOfStudy: 'I' | 'II' | 'III' | 'IV' | 'V' = 'I'): GraduationData => {
  const creationDate = parseISO(userCreationDate);
  let targetGraduationYear: number;

  // Determine graduation year based on yearOfStudy
  switch (yearOfStudy) {
    case 'I':
      targetGraduationYear = creationDate.getFullYear() + 4; // Assuming 4-year degree
      break;
    case 'II':
      targetGraduationYear = creationDate.getFullYear() + 3;
      break;
    case 'III':
      targetGraduationYear = creationDate.getFullYear() + 2;
      break;
    case 'IV':
      targetGraduationYear = creationDate.getFullYear() + 1;
      break;
    case 'V': // For 5-year integrated courses
      targetGraduationYear = creationDate.getFullYear() + 0; // Already in final year
      break;
    default:
      targetGraduationYear = creationDate.getFullYear() + 4;
  }

  // Set graduation date to a fixed day/month, e.g., July 1st of the target year
  const graduationDate = new Date(targetGraduationYear, 6, 1); // July is month 6 (0-indexed)

  const now = new Date();
  const totalDays = differenceInDays(graduationDate, creationDate);
  const remainingDays = differenceInDays(graduationDate, now);

  const isGraduated = isPast(graduationDate);

  const progress = totalDays > 0 ? Math.max(0, Math.min(100, ((totalDays - remainingDays) / totalDays) * 100)) : 0;

  // Calculate countdown
  const diffTime = graduationDate.getTime() - now.getTime();
  const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30); // Approximation
  const days = diffDays - (years * 365) - (months * 30);

  return {
    graduationDate: format(graduationDate, 'PPP'),
    remainingDays: Math.max(0, remainingDays),
    totalDays: Math.max(0, totalDays),
    progress: isGraduated ? 100 : progress,
    isGraduated,
    countdown: {
      years: Math.max(0, years),
      months: Math.max(0, months),
      days: Math.max(0, days),
    },
  };
};