// src/utils/avatar.ts
// This utility generates a consistent avatar URL based on user properties.

export const generateAvatarUrl = (
  name: string,
  gender: string = "prefer-not-to-say",
  userType: string = "student",
  avatarStyle: string = "lorelei"
): string => {
  const seed = name.replace(/\s/g, '') + gender + userType;
  // Example using DiceBear API (replace with your preferred avatar service)
  return `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${seed}&size=64&radius=50&backgroundColor=random`;
};