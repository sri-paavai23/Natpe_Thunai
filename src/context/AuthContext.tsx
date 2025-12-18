"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Account, Client, Databases, Models, Query, ID } from "appwrite";
import { APPWRITE_PROJECT_ID, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { toast } from "sonner";

interface UserProfile extends Models.Document {
  userId: string;
  name: string;
  email: string;
  collegeName: string;
  role: "user" | "ambassador" | "developer" | "staff"; // Added 'staff'
  level: number;
  upiId?: string;
  hostelRoom?: string;
  phone?: string;
  age?: number;
  currentXp?: number;
  maxXp?: number;
  gender?: "male" | "female" | "other" | "prefer-not-to-say";
  userType?: "student" | "staff" | "faculty";
  avatarStyle?: string;
  itemsListedToday?: number;
  lastQuestCompletedDate?: string;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  ambassadorDeliveriesCount?: number;
}

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVerified: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, collegeName: string) => Promise<void>;
  updateUserProfile: (profileData: Partial<UserProfile>) => Promise<void>;
  refetchUserProfile: () => Promise<void>;
  addXp: (amount: number) => Promise<void>;
  recordMarketListing: () => Promise<void>;
  incrementAmbassadorDeliveriesCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const client = new Client();
client.setEndpoint("https://cloud.appwrite.io/v1").setProject(APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

export const AuthProvider = ({ children }: { children: ReactNode }) => { // Corrected children prop type
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;
  const isVerified = user?.emailVerification ?? false;

  const fetchUserAndProfile = async () => {
    setIsLoading(true);
    try {
      const currentUser = await account.get();
      setUser(currentUser);

      const profileResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.equal("userId", currentUser.$id)]
      );

      if (profileResponse.documents.length > 0) {
        setUserProfile(profileResponse.documents[0] as unknown as UserProfile);
      } else {
        setUserProfile(null);
      }
    } catch (error) {
      setUser(null);
      setUserProfile(null);
      console.error("Failed to fetch user or profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndProfile();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await account.createEmailPasswordSession(email, password);
      await fetchUserAndProfile();
      toast.success("Logged in successfully!");
    } catch (error: any) {
      toast.error(error.message || "Login failed.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await account.deleteSession("current");
      setUser(null);
      setUserProfile(null);
      toast.info("Logged out successfully.");
    } catch (error: any) {
      toast.error(error.message || "Logout failed.");
      console.error("Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, collegeName: string) => {
    setIsLoading(true);
    try {
      const newUser = await account.create(ID.unique(), email, password, name);
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        newUser.$id,
        {
          userId: newUser.$id,
          name: name,
          email: email,
          collegeName: collegeName,
          role: "user",
          level: 1,
          currentXp: 0,
          maxXp: 100,
          itemsListedToday: 0,
          ambassadorDeliveriesCount: 0,
        }
      );
      await account.createEmailPasswordSession(email, password);
      await fetchUserAndProfile();
      toast.success("Account created and logged in!");
    } catch (error: any) {
      toast.error(error.message || "Registration failed.");
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (profileData: Partial<UserProfile>) => {
    if (!userProfile) {
      toast.error("No user profile to update.");
      return;
    }
    setIsLoading(true);
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        userProfile.$id,
        profileData
      );
      await fetchUserAndProfile();
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile.");
      console.error("Profile update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refetchUserProfile = async () => {
    await fetchUserAndProfile();
  };

  const addXp = async (amount: number) => {
    if (!userProfile) return;
    const newXp = (userProfile.currentXp || 0) + amount;
    const newMaxXp = userProfile.maxXp || 100;
    let newLevel = userProfile.level || 1;

    if (newXp >= newMaxXp) {
      newLevel += 1;
      toast.success(`Congratulations! You reached Level ${newLevel}!`);
      await updateUserProfile({ level: newLevel, currentXp: newXp - newMaxXp, maxXp: newMaxXp + 50 });
    } else {
      await updateUserProfile({ currentXp: newXp });
    }
  };

  const recordMarketListing = async () => {
    if (!userProfile) return;
    const today = new Date().toISOString().split('T')[0];
    const lastQuestDate = userProfile.lastQuestCompletedDate?.split('T')[0];

    let itemsListed = userProfile.itemsListedToday || 0;
    if (lastQuestDate !== today) {
      itemsListed = 0;
    }
    itemsListed += 1;
    await updateUserProfile({ itemsListedToday: itemsListed });
    toast.info(`You've listed ${itemsListed} item(s) today for your daily quest!`);
  };

  const incrementAmbassadorDeliveriesCount = async () => {
    if (!userProfile) return;
    const newCount = (userProfile.ambassadorDeliveriesCount || 0) + 1;
    await updateUserProfile({ ambassadorDeliveriesCount: newCount });
    toast.success(`Ambassador delivery count updated to ${newCount}!`);
  };


  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      isLoading,
      isAuthenticated,
      isVerified,
      login,
      logout,
      register,
      updateUserProfile,
      refetchUserProfile,
      addXp,
      recordMarketListing,
      incrementAmbassadorDeliveriesCount,
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