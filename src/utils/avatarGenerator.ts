// src/utils/avatarGenerator.ts

/**
 * Generates a DiceBear avatar URL based on username, gender, and user type.
 * Uses the 'personas' style for gender-specific avatars.
 *
 * @param username The public username of the user.
 * @param gender The gender of the user ('male', 'female', 'prefer-not-to-say').
 * @param userType The type of user ('student', 'staff').
 * @returns A URL to the generated DiceBear avatar.
 */
export const generateAvatarUrl = (
  username: string,
  gender: "male" | "female" | "prefer-not-to-say",
  userType: "student" | "staff"
): string => {
  const baseUrl = "https://api.dicebear.com/8.x/personas/svg";
  
  // Use username as seed for consistent avatar generation
  const seed = encodeURIComponent(username);

  let genderParam = "";
  if (gender === "male") {
    genderParam = "&gender=male";
  } else if (gender === "female") {
    genderParam = "&gender=female";
  }
  // If 'prefer-not-to-say', no specific gender param is added, DiceBear will pick a default.

  // You can add other parameters if the 'personas' style supports them,
  // e.g., hair, accessories, etc. For now, keeping it simple.
  // Example: &hair=long,short&accessories=glasses
  
  return `${baseUrl}?seed=${seed}${genderParam}`;
};