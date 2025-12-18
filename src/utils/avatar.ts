// src/utils/avatar.ts
// This utility generates a consistent avatar URL based on user properties.

export const generateAvatarUrl = (
  name: string,
  gender: "male" | "female" | "other" | "prefer-not-to-say" = "prefer-not-to-say", // Updated type
  userType: "student" | "staff" | "faculty" = "student", // Updated type
  avatarStyle: string = "lorelei"
): string => {
  const seed = name.replace(/\s/g, '') + gender + userType;
  // Example using DiceBear API (replace with your preferred avatar service)
  return `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${seed}&size=64&radius=50&backgroundColor=random`;
};