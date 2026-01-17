"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { account, databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Models, Query } from "appwrite";
// Import the new leveling logic functions
import { calculateMaxXpForLevel, checkAndApplyLevelUp } from "@/utils/leveling";
import { isToday } from "date-fns";

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
  lastQuestCompletedDate: string | null;
  itemsListedToday: number;
  avatarStyle: string;
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
  deductXp: (amount: number, reason: string) => Promise<void>;
  incrementAmbassadorDeliveriesCount: () => Promise<void>;
  recordMarketListing: () => Promise<void>;
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
        let level = profile.level ?? 1;
        let currentXp = profile.currentXp ?? 0;
        
        // 1. Calculate the initial Max XP based on the current level using the new formula
        let maxXp = calculateMaxXpForLevel(level);

        // 2. RECONCILIATION: Check if the new curve means the user should have leveled up already.
        // This handles the transition from the Old Curve to the New Curve automatically.
        const reconciled = checkAndApplyLevelUp(level, currentXp, maxXp);
        
        // Update local variables with reconciled values
        level = reconciled.newLevel;
        currentXp = reconciled.newCurrentXp;
        maxXp = reconciled.newMaxXp;

        // Reset itemsListedToday if it's a new day
        let itemsListedToday = profile.itemsListedToday ?? 0;
        const lastQuestDate = profile.lastQuestCompletedDate ? new Date(profile.lastQuestCompletedDate) : null;
        if (lastQuestDate && !isToday(lastQuestDate)) {
          itemsListedToday = 0;
        }

        // 3. Construct the profile object with reconciled Level/XP data
        const completeProfile: UserProfile = {
          ...profile,
          level: level,
          currentXp: currentXp,
          maxXp: maxXp,
          collegeName: profile.collegeName || "Unknown College",
          ambassadorDeliveriesCount: profile.ambassadorDeliveriesCount ?? 0,
          lastQuestCompletedDate: profile.lastQuestCompletedDate ?? null,
          itemsListedToday: itemsListedToday,
          avatarStyle: profile.avatarStyle || "lorelei",
        };
        
        setUserProfile(completeProfile);

        // OPTIONAL: If the level changed due to reconciliation, save it to DB silently
        if (level !== (profile.level ?? 1)) {
             // We don't await this to keep the UI snappy, just sync in background
             databases.updateDocument(
                 APPWRITE_DATABASE_ID, 
                 APPWRITE_USER_PROFILES_COLLECTION_ID, 
                 profile.$id, 
                 { level, currentXp }
             ).catch(err => console.error("Silent level sync failed", err));
        }

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
        lastQuestCompletedDate: updatedProfileData.lastQuestCompletedDate ?? null,
        itemsListedToday: updatedProfileData.itemsListedToday ?? 0,
        avatarStyle: updatedProfileData.avatarStyle || "lorelei",
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
    // We recalculate MaxXP here to be safe, rather than relying on stale state
    let maxXp = calculateMaxXpForLevel(currentLevel); 

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
    
    if (currentXp < 0) currentXp = 0;

    let newLevel = currentLevel;
    let newMaxXp = calculateMaxXpForLevel(newLevel);

    // Logic remains robust with new formula: checks previous level's incremental cap
    while (newLevel > 1 && currentXp < calculateMaxXpForLevel(newLevel - 1)) {
      newLevel -= 1;
      newMaxXp = calculateMaxXpForLevel(newLevel);
      currentXp = newMaxXp + currentXp; 
    }
    if (newLevel === 1 && currentXp < 0) currentXp = 0; 

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

  const recordMarketListing = async () => {
    if (!userProfile || !user) {
      console.warn("Cannot record market listing: User not logged in or profile missing.");
      return;
    }

    let currentItemsListedToday = userProfile.itemsListedToday ?? 0;
    const lastQuestDate = userProfile.lastQuestCompletedDate ? new Date(userProfile.lastQuestCompletedDate) : null;

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
      login, 
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