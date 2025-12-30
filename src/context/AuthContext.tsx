"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Account, Client, Databases, ID, Query } from "appwrite";
import { toast } from "sonner";

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const APPWRITE_USER_PROFILES_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_USER_PROFILES_COLLECTION_ID;

export interface UserProfile {
  $id: string;
  userId: string;
  name: string;
  email: string;
  collegeName: string;
  collegeId?: string; // Essential for filtering
  role: string;
  // NEW FIELDS
  userType: "student" | "merchant" | "admin";
  merchantName?: string;
  servedCollegeIds?: string[];
  businessDescription?: string;
  // ... (keep other existing fields like bio, avatarUrl etc)
}

interface AuthContextType {
  user: any | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    collegeName: string,
    role?: string,
    merchantData?: any
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkUserStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkUserStatus = async () => {
    try {
      setIsLoading(true);
      const currentUser = await account.get();
      setUser(currentUser);

      const profileRes = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.equal("userId", currentUser.$id)]
      );

      if (profileRes.documents.length > 0) {
        setUserProfile(profileRes.documents[0] as UserProfile);
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
    checkUserStatus();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await account.createEmailPasswordSession(email, password);
      await checkUserStatus();
      toast.success("Logged in successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    collegeName: string,
    role: string = "user",
    merchantData?: any
  ) => {
    try {
      setIsLoading(true);
      // 1. Create Account
      const accountRes = await account.create(ID.unique(), email, password, name);

      // 2. Create Session
      await account.createEmailPasswordSession(email, password);

      // 3. Create User Profile
      const profileData: any = {
        userId: accountRes.$id,
        name: name,
        email: email,
        collegeName: collegeName, // For merchants, this might be their "Home Base" or empty
        role: role,
        userType: merchantData ? "merchant" : "student",
      };

      if (merchantData) {
        profileData.merchantName = merchantData.merchantName;
        profileData.businessDescription = merchantData.description;
        profileData.servedCollegeIds = merchantData.servedColleges; // Array of IDs
      }

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        ID.unique(),
        profileData
      );

      // Fetch user again to update state
      await checkUserStatus();

      toast.success("Account created successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await account.deleteSession("current");
      setUser(null);
      setUserProfile(null);
      toast.info("Logged out.");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Logout failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isLoading,
        login,
        register,
        logout,
        checkUserStatus,
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