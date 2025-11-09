"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { account, databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Models, Query } from "appwrite"; // Import Query

interface AppwriteUser extends Models.User<Models.Preferences> {}

interface UserProfile extends Models.Document {
  userId: string;
  firstName: string;
  lastName: string;
  age: number;
  mobileNumber: string;
  upiId: string;
  collegeIdPhotoId?: string;
  role: string; // Made required and explicit
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AppwriteUser | null;
  userProfile: UserProfile | null;
  login: () => Promise<void>;
  logout: () => void;
  updateUserProfile: (profileId: string, data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AppwriteUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.equal('userId', userId)] // Use Query to fetch specific user profile
      );
      const profile = response.documents[0] as unknown as UserProfile | undefined; // Assuming userId is unique
      if (profile) {
        setUserProfile(profile);
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
      throw new Error(error.message || "Failed to update profile.");
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
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, userProfile, login: loginUser, logout, updateUserProfile }}>
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