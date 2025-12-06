"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { account, databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { Models, Query } from "appwrite";
import { toast } from "sonner";

// Define the User and UserProfile types
interface AppwriteUser extends Models.User<Models.Preferences> {
  name: string;
  email: string;
}

interface UserProfile extends Models.Document {
  userId: string;
  firstName: string;
  lastName: string;
  age: number;
  mobileNumber: string;
  upiId: string;
  collegeIdPhotoId: string | null;
  role: "user" | "developer" | "ambassador";
  gender: "male" | "female" | "prefer-not-to-say";
  userType: "student" | "staff";
  collegeName: string;
  level: number;
  currentXp: number;
  maxXp: number;
  ambassadorDeliveriesCount?: number; // NEW: Add ambassadorDeliveriesCount
}

interface AuthContextType {
  user: AppwriteUser | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profileId: string, data: Partial<UserProfile>) => Promise<void>; // NEW: Add updateUserProfile
  incrementAmbassadorDeliveriesCount: () => Promise<void>; // NEW: Add incrementAmbassadorDeliveriesCount
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppwriteUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserAndProfile = useCallback(async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
      setIsAuthenticated(true);

      // Fetch user profile
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.equal("userId", currentUser.$id)]
      );

      if (response.documents.length > 0) {
        setUserProfile(response.documents[0] as unknown as UserProfile);
      } else {
        setUserProfile(null); // No profile found
      }
    } catch (error) {
      console.error("Failed to fetch user or profile:", error);
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserAndProfile();

    // Set up real-time subscription for user profile changes
    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_USER_PROFILES_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as UserProfile;
        if (userProfile && payload.$id === userProfile.$id) {
          setUserProfile(payload);
          toast.info("Your profile has been updated in real-time!");
        }
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchUserAndProfile, userProfile]); // Added userProfile to dependencies to re-subscribe if its ID changes (though unlikely)

  const login = async () => {
    setIsLoading(true);
    await fetchUserAndProfile();
  };

  const logout = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      toast.success("Logged out successfully!");
    } catch (error: any) {
      console.error("Failed to log out:", error);
      toast.error(error.message || "Failed to log out.");
    }
  };

  const updateUserProfile = async (profileId: string, data: Partial<UserProfile>) => {
    if (!user) {
      toast.error("You must be logged in to update your profile.");
      return;
    }
    try {
      const updatedDoc = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        profileId,
        data
      );
      setUserProfile(updatedDoc as unknown as UserProfile);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      toast.error(error.message || "Failed to update profile.");
      throw error; // Re-throw to allow form to handle error state
    }
  };

  const incrementAmbassadorDeliveriesCount = async () => {
    if (!userProfile || !user) {
      toast.error("User profile not found. Cannot increment ambassador deliveries.");
      return;
    }

    const currentCount = userProfile.ambassadorDeliveriesCount || 0;
    const newCount = currentCount + 1;

    try {
      await updateUserProfile(userProfile.$id, { ambassadorDeliveriesCount: newCount });
      toast.success(`Ambassador deliveries count updated to ${newCount}!`);
    } catch (error) {
      console.error("Failed to increment ambassador deliveries count:", error);
      toast.error("Failed to update ambassador deliveries count.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateUserProfile,
        incrementAmbassadorDeliveriesCount,
      }}
    >
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