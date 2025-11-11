// src/utils/avatarGenerator.ts
export const generateAvatarUrl = (
  seed: string,
  gender: "male" | "female" | "prefer-not-to-say",
  userType: "student" | "staff"
): string => {
  let style = "lorelei"; // Default style
  let genderParam = "";

  if (gender === "male") {
    genderParam = "&gender=male";
  } else if (gender === "female") {
    genderParam = "&gender=female";
  }

  if (userType === "student") {
    style = "adventurer"; // Chill style for students
  } else if (userType === "staff") {
    style = "personas"; // Professional style for staff
  }

  return `https://api.dicebear.com/8.x/${style}/svg?seed=${encodeURIComponent(seed)}${genderParam}`;
};