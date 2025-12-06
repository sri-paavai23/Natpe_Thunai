export const getLevelBadge = (level: number): string => {
  if (level >= 10) {
    return "Campus Legend";
  } else if (level >= 8) {
    return "Elite Member";
  } else if (level >= 6) {
    return "Campus Veteran";
  } else if (level >= 4) {
    return "Community Contributor";
  } else if (level >= 2) {
    return "Explorer";
  } else {
    return "Campus Newbie"; // Level 1
  }
};