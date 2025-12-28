"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { account, databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Models, Query } from "appwrite";
import { calculateMaxXpForLevel, checkAndApplyLevelUp } from "@/utils/leveling";
import { isToday } from "date-fns"; // NEW: Import isToday

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
  collegeName: string;
  level: number;
  currentXp: number;
  maxXp: number;
  ambassadorDeliveriesCount: number;
  lastQuestCompletedDate: string | null; // NEW: Track last quest completion
  itemsListedToday: number; // NEW: Track items listed today for quests
  avatarStyle: string; // NEW: Add avatarStyle
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AppwriteUser | null;
  userProfile: UserProfile | null;
  isVerified: boolean;
  login: () => Promise<void>; // Re-added: Function to trigger session re-check
  logout: () => void;
  updateUserProfile: (profileId: string, data: Partial<UserProfile>) => Promise<void>;
  addXp: (amount: number) => Promise<void>;
  deductXp: (amount: number, reason: string) => Promise<void>;
  incrementAmbassadorDeliveriesCount: () => Promise<void>;
  recordMarketListing: () => Promise<void>; // NEW: Function to record market listings
  // handleAuthSuccess: (currentUser: AppwriteUser) => Promise<void>; // Removed
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

        // Reset itemsListedToday if it's a new day since last quest completion
        let itemsListedToday = profile.itemsListedToday ?? 0;
        const lastQuestDate = profile.lastQuestCompletedDate ? new Date(profile.lastQuestCompletedDate) : null;
        if (lastQuestDate && !isToday(lastQuestDate)) {
          itemsListedToday = 0; // Reset if it's a new day
        }

        const completeProfile: UserProfile = {
          ...profile,
          level: level,
          currentXp: profile.currentXp ?? 0,
          maxXp: maxXp,
          collegeName: profile.collegeName || "Unknown College",
          ambassadorDeliveriesCount: profile.ambassadorDeliveriesCount ?? 0,
          lastQuestCompletedDate: profile.lastQuestCompletedDate ?? null, // Initialize new field
          itemsListedToday: itemsListedToday, // Initialize new field
          avatarStyle: profile.avatarStyle || "lorelei", // NEW: Initialize avatarStyle
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

  // Re-added login function
  const login = useCallback(async () => {
    setIsLoading(true);
    await checkUserSession();
  }, [checkUserSession]);


  useEffect(() => {
    checkUserSession();
  }, [checkUserSession]);

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
        collegeName: updatedProfileData.collegeName || "Unknown College",
        ambassadorDeliveriesCount: updatedProfileData.ambassadorDeliveriesCount ?? 0,
        lastQuestCompletedDate: updatedProfileData.lastQuestCompletedDate ?? null, // Ensure new field is updated
        itemsListedToday: updatedProfileData.itemsListedToday ?? 0, // Ensure new field is updated
        avatarStyle: updatedProfileData.avatarStyle || "lorelei", // NEW: Ensure avatarStyle is updated
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

  const deductXp = async (amount: number, reason: string) => {
    if (!userProfile || !user) {
      toast.error("Cannot deduct XP: User not logged in or profile missing.");
      return;
    }

    let currentLevel = userProfile.level;
    let currentXp = userProfile.currentXp - amount;
    
    // Ensure XP doesn't go below zero
    if (currentXp < 0) currentXp = 0;

    // Recalculate level if XP drops below current level's threshold
    let newLevel = currentLevel;
    let newMaxXp = calculateMaxXpForLevel(newLevel);

    while (newLevel > 1 && currentXp < calculateMaxXpForLevel(newLevel - 1)) {
      newLevel -= 1;
      newMaxXp = calculateMaxXpForLevel(newLevel);
      currentXp = newMaxXp + currentXp; // Carry over remaining XP to the new lower level
    }
    if (newLevel === 1 && currentXp < 0) currentXp = 0; // Ensure XP is not negative at level 1

    try {
      if (newLevel !== currentLevel || currentXp !== userProfile.currentXp) {
        await updateUserProfile(userProfile.$id, {
          level: newLevel,
          currentXp: currentXp,
        });
      }

      if (newLevel < currentLevel) {
        toast.warning(`LEVEL DOWN! You dropped to Level ${newLevel} due to ${reason}.`);
      } else {
        toast.warning(`-${amount} XP deducted due to ${reason}.`);
      }
    } catch (error) {
      toast.error("Failed to deduct XP/Level.");
    }
  };

  const incrementAmbassadorDeliveriesCount = async () => {
    if (!userProfile || !user) {
      console.warn("Cannot increment ambassador deliveries count: User not logged in or profile missing.");
      return;
    }
    const newCount = (userProfile.ambassadorDeliveriesCount || 0) + 1;
    try {
      await updateUserProfile(userProfile.$id, { ambassadorDeliveriesCount: newCount });
      console.log(`Ambassador deliveries count incremented to ${newCount}`);

      const AMBASSADOR_MISUSE_THRESHOLD = userProfile.gender === "female" ? 10 : 5;
      const XP_DEDUCTION_AMOUNT = userProfile.gender === "female" ? 10 : 25;

      if (newCount > AMBASSADOR_MISUSE_THRESHOLD && newCount % AMBASSADOR_MISUSE_THRESHOLD === 1) {
        toast.warning(`Excessive ambassador delivery usage detected (${newCount} times). This may lead to XP deduction.`);
        await deductXp(XP_DEDUCTION_AMOUNT, "excessive ambassador delivery usage");
      }
    } catch (error) {
      console.error("Failed to update ambassador deliveries count:", error);
    }
  };

  // NEW: Function to record market listings for daily quest
  const recordMarketListing = async () => {
    if (!userProfile || !user) {
      console.warn("Cannot record market listing: User not logged in or profile missing.");
      return;
    }

    let currentItemsListedToday = userProfile.itemsListedToday ?? 0;
    const lastQuestDate = userProfile.lastQuestCompletedDate ? new Date(userProfile.lastQuestCompletedDate) : null;

    // Reset if it's a new day since last quest completion
    if (lastQuestDate && !isToday(lastQuestDate)) {
      currentItemsListedToday = 0;
    }

    currentItemsListedToday += 1;

    try {
      await updateUserProfile(userProfile.$id, { itemsListedToday: currentItemsListedToday });
      toast.info(`You've listed ${currentItemsListedToday} item(s) today for the daily quest!`);
    } catch (error) {
      console.error("Failed to record market listing:", error);
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
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      user, 
      userProfile, 
      isVerified, 
      login, // Re-added
      logout, 
      updateUserProfile, 
      addXp, 
      deductXp, 
      incrementAmbassadorDeliveriesCount, 
      recordMarketListing,
    }}>
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