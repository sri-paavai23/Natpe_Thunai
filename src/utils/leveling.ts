"use client";

/**
 * Calculates the total XP required to reach the next level.
 * Uses a linear growth curve for more gradual progression.
 * @param currentLevel The user's current level (must be >= 1).
 * @returns The total XP required for the next level.
 */
export const calculateMaxXpForLevel = (currentLevel: number): number => {
  const BASE_XP = 100; // XP required for Level 1
  const XP_INCREMENT_PER_LEVEL = 50; // Additional XP required for each subsequent level

  if (currentLevel <= 1) {
    return BASE_XP;
  }

  // Formula: BASE_XP + (currentLevel - 1) * XP_INCREMENT_PER_LEVEL
  return BASE_XP + (currentLevel - 1) * XP_INCREMENT_PER_LEVEL;
};

/**
 * Checks if the user has enough XP to level up and returns the new profile state.
 * Handles multiple level ups in one go.
 * @param currentLevel Current level.
 * @param currentXp Current XP accumulated in the current level (including newly added XP).
 * @param maxXp Max XP for the current level.
 * @returns An object containing the new level, new currentXp, and new maxXp.
 */
export const checkAndApplyLevelUp = (currentLevel: number, currentXp: number, maxXp: number) => {
  let newLevel = currentLevel;
  let newCurrentXp = currentXp;
  let newMaxXp = maxXp;

  while (newCurrentXp >= newMaxXp) {
    newCurrentXp -= newMaxXp;
    newLevel += 1;
    newMaxXp = calculateMaxXpForLevel(newLevel);
  }

  return { newLevel, newCurrentXp, newMaxXp };
};