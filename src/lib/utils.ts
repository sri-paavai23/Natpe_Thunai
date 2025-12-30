import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import collegesData from '../../colleges.json';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getColleges = () => {
  return collegesData.colleges;
};

export const getCollegeNameById = (id: string) => {
  const college = collegesData.colleges.find(c => c.id === id);
  return college ? college.name : 'Unknown College';
};