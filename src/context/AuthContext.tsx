"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { account, databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Models, Query } from "appwrite"; // Import Query
import { calculateMaxXpForLevel, checkAndApplyLevelUp } from "@/utils/leveling"; // NEW IMPORT

interface AppwriteUser extends Models.User<Models.Preferences> {}

interface UserProfile extends Models.Document {
  userId: string;
  firstName: string;
  lastName: string;
  age: number;
  mobileNumber: string;
  upiId: string;
  collegeIdPhotoId?: string;
  role: "user" | "developer"; // Appwrite system role
  gender: "male" | "female" | "prefer-not-to-say"; // New field
  userType: "student" | "staff"; // New field
  // Dynamic Leveling Fields (maxXp is calculated client-side but might be stored)
  level: number;
  currentXp: number;
  maxXp: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AppwriteUser | null;
  userProfile: UserProfile | null;
  isVerified: boolean; // Added verification status
  login: () => Promise<void>;
  logout: () => void;
  updateUserProfile: (profileId: string, data: Partial<UserProfile>) => Promise<void>;
  addXp: (amount: number) => Promise<void>; // NEW METHOD
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AppwriteUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  const isVerified = user?.emailVerification ?? false; // Calculate verification status

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.equal('userId', userId)] // Use Query to fetch specific user profile
      );
      const profile = response.documents[0] as unknown as UserProfile | undefined; // Assuming userId is unique
      if (profile) {
        // Calculate dynamic Max XP based on fetched level, or default to 100 if level is 1
        const level = profile.level ?? 1;
        const maxXp = calculateMaxXpForLevel(level); // Use dynamic calculation

        const completeProfile: UserProfile = {
          ...profile,
          level: level,
          currentXp: profile.currentXp ?? 0,
          maxXp: maxXp,
        };
        setUserProfile(completeProfile);
      } else {
        console.warn("User profile not found for user:", userId);
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserProfile(null);
    }
  }, []);

  const checkUserSession = useCallback(async () => {
    try {
      const currentUser = await account.get();
      setIsAuthenticated(true);
      setUser(currentUser);
      await fetchUserProfile(currentUser.$id);
    } catch (error) {
      setIsAuthenticated(false);
      setUser(null);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    checkUserSession();
  }, [checkUserSession]);

  const loginUser = async () => {
    setIsLoading(true);
    await checkUserSession(); // Re-check session and fetch profile after login
    setIsLoading(false);
  };

  const logout = async () => {
    try {
      await account.deleteSession("current");
      setIsAuthenticated(false);
      setUser(null);
      setUserProfile(null);
      toast.success("Logged out successfully!");
      navigate("/auth", { replace: true });
    } catch (error: any) {
      toast.error(error.message || "Failed to log out.");
      console.error("Logout error:", error);
    }
  };

  const updateUserProfile = async (profileId: string, data: Partial<UserProfile>) => {
    try {
      // Filter out derived fields like maxXp before sending to DB
      const { maxXp, ...dataToSave } = data;

      const updatedDoc = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        profileId,
        dataToSave
      );
      
      // Ensure we use the data returned from the database, which should include all fields
      const updatedProfileData = updatedDoc as unknown as UserProfile;
      
      // Recalculate Max XP based on the potentially new level, ensuring defaults if fields are missing
      const level = updatedProfileData.level ?? 1;
      const calculatedMaxXp = calculateMaxXpForLevel(level);

      const updatedProfile: UserProfile = {
        ...updatedProfileData,
        level: level,
        currentXp: updatedProfileData.currentXp ?? 0,
        maxXp: calculatedMaxXp,
      };
      setUserProfile(updatedProfile);
      // Do NOT show success toast here, let the caller (like addXp or EditProfileForm) handle it.
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      throw new Error(error.message || "Failed to update profile.");
    }
  };

  const addXp = async (amount: number) => {
    if (!userProfile || !user) {
      toast.error("Cannot add XP: User not logged in or profile missing.");
      return;
    }

    let currentLevel = userProfile.level;
    let currentXp = userProfile.currentXp + amount;
    let maxXp = userProfile.maxXp;

    const { newLevel, newCurrentXp, newMaxXp } = checkAndApplyLevelUp(currentLevel, currentXp, maxXp);

    try {
      // Only update if there's a change in XP or level
      if (newLevel !== currentLevel || newCurrentXp !== userProfile.currentXp) {
        // Use updateUserProfile to handle the database update and local state sync
        // We only send level and currentXp to the database.
        await updateUserProfile(userProfile.$id, {
          level: newLevel,
          currentXp: newCurrentXp,
        });
      }

      if (newLevel > currentLevel) {
        toast.success(`LEVEL UP! You reached Level ${newLevel}! Commission rate reduced.`);
      } else {
        toast.info(`+${amount} XP earned!`);
      }
    } catch (error) {
      // Error is already logged and thrown by updateUserProfile, just toast the failure here.
      toast.error("Failed to update XP/Level.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-secondary-neon" />
        <p className="ml-3 text-lg text-muted-foreground">Loading application...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, userProfile, isVerified, login: loginUser, logout, updateUserProfile, addXp }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};