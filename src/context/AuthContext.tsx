"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { account, databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Models, Query } from "appwrite";
import { calculateMaxXpForLevel, checkAndApplyLevelUp } from "@/utils/leveling";

interface AppwriteUser extends Models.User<Models.Preferences> {}

interface UserProfile extends Models.Document {
  userId: string;
  firstName: string;
  lastName: string;
  age: number;
  mobileNumber: string;
  upiId: string;
  collegeIdPhotoId?: string;
  role: "user" | "developer";
  gender: "male" | "female" | "prefer-not-to-say";
  userType: "student" | "staff";
  collegeName: string; // NEW: Added collegeName
  level: number;
  currentXp: number;
  maxXp: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AppwriteUser | null;
  userProfile: UserProfile | null;
  isVerified: boolean;
  login: () => Promise<void>;
  logout: () => void;
  updateUserProfile: (profileId: string, data: Partial<UserProfile>) => Promise<void>;
  addXp: (amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AppwriteUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  const isVerified = user?.emailVerification ?? false;

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );
      const profile = response.documents[0] as unknown as UserProfile | undefined;
      if (profile) {
        const level = profile.level ?? 1;
        const maxXp = calculateMaxXpForLevel(level);

        const completeProfile: UserProfile = {
          ...profile,
          level: level,
          currentXp: profile.currentXp ?? 0,
          maxXp: maxXp,
          collegeName: profile.collegeName || "Unknown College", // Ensure collegeName is set
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
    await checkUserSession();
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
      const { maxXp, ...dataToSave } = data;

      const updatedDoc = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        profileId,
        dataToSave
      );
      
      const updatedProfileData = updatedDoc as unknown as UserProfile;
      
      const level = updatedProfileData.level ?? 1;
      const calculatedMaxXp = calculateMaxXpForLevel(level);

      const updatedProfile: UserProfile = {
        ...updatedProfileData,
        level: level,
        currentXp: updatedProfileData.currentXp ?? 0,
        maxXp: calculatedMaxXp,
        collegeName: updatedProfileData.collegeName || "Unknown College", // Ensure collegeName is set
      };
      setUserProfile(updatedProfile);
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
      if (newLevel !== currentLevel || newCurrentXp !== userProfile.currentXp) {
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