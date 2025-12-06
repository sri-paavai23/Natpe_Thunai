"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Account, Models, Query } from 'appwrite'; // Import Query
import { client, databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from '@/lib/appwrite';
import { toast } from 'sonner';
import { checkAndApplyLevelUp, calculateMaxXpForLevel } from '@/utils/leveling';

// Extend the Appwrite User interface to include custom profile data
export interface UserProfile extends Models.Document {
  userId: string;
  name: string;
  email: string;
  mobileNumber?: string;
  role: 'user' | 'developer' | 'ambassador';
  level: number;
  currentXp: number;
  profilePictureUrl?: string;
  address?: string;
  collegeName?: string;
  department?: string;
  walletBalance?: number;
  totalEarned?: number;
  totalSpent?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say'; // Added
  userType?: 'student' | 'faculty' | 'alumni'; // Added
  upiId?: string; // Added
  age?: number; // Added
  firstName?: string; // Added
  lastName?: string; // Added
  isVerified?: boolean; // Added
}

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean; // Added
  isVerified: boolean; // Added
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, mobileNumber: string, collegeName: string, department: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  addXp: (amount: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const account = new Account(client);

export const AuthProvider = ({ children }: { ReactNode }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const loggedInUser = await account.get();
      setUser(loggedInUser);
      await fetchUserProfile(loggedInUser.$id);
    } catch (error) {
      setUser(null);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [
          Query.equal('userId', userId), // Fixed: Use Query.equal
        ]
      );
      if (response.documents.length > 0) {
        setUserProfile(response.documents[0] as UserProfile); // Fixed: Cast to UserProfile
      } else {
        // If no profile exists, create a basic one
        const newProfile = await databases.createDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_USER_PROFILES_COLLECTION_ID,
          userId, // Use userId as document ID for easy lookup
          {
            userId: userId,
            name: user?.name || 'New User', // Fallback if user object not fully loaded yet
            email: user?.email || '',
            role: 'user',
            level: 1,
            currentXp: 0,
            walletBalance: 0,
            totalEarned: 0,
            totalSpent: 0,
            isVerified: false, // Default to false
          }
        );
        setUserProfile(newProfile as UserProfile); // Fixed: Cast to UserProfile
      }
    } catch (error) {
      console.error("Error fetching or creating user profile:", error);
      setUserProfile(null);
    }
  }, [user?.name, user?.email]); // Added user.name and user.email to dependencies

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await account.createSession(email, password); // Fixed: createSession
      await fetchUser();
      toast.success("Logged in successfully!");
    } catch (error: any) {
      toast.error(error.message || "Login failed.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, mobileNumber: string, collegeName: string, department: string) => {
    setIsLoading(true);
    try {
      const newUser = await account.create("unique()", email, password, name);
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        newUser.$id, // Use user ID as document ID
        {
          userId: newUser.$id,
          name: name,
          email: email,
          mobileNumber: mobileNumber,
          role: 'user',
          level: 1,
          currentXp: 0,
          address: '',
          collegeName: collegeName,
          department: department,
          walletBalance: 0,
          totalEarned: 0,
          totalSpent: 0,
          firstName: name.split(' ')[0] || '',
          lastName: name.split(' ').slice(1).join(' ') || '',
          age: 0,
          upiId: '',
          gender: 'prefer-not-to-say',
          userType: 'student',
          isVerified: false, // Default to false
        }
      );
      await account.createSession(email, password); // Fixed: createSession
      await fetchUser();
      toast.success("Registration successful! Welcome to Natpe🤝Thunai.");
    } catch (error: any) {
      toast.error(error.message || "Registration failed.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await account.deleteSession('current');
      setUser(null);
      setUserProfile(null);
    } catch (error: any) {
      toast.error(error.message || "Logout failed.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!userProfile) {
      toast.error("No user profile found to update.");
      return;
    }
    try {
      const updatedDoc = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        userProfile.$id,
        data
      );
      setUserProfile(updatedDoc as UserProfile); // Fixed: Cast to UserProfile
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      toast.error(error.message || "Failed to update profile.");
      throw error;
    }
  };

  const addXp = async (amount: number) => {
    if (!userProfile) {
      toast.error("Cannot add XP: User profile not loaded.");
      return;
    }

    const newCurrentXp = userProfile.currentXp + amount;
    const maxXp = calculateMaxXpForLevel(userProfile.level);

    const { newLevel, newCurrentXp: updatedXp, newMaxXp } = checkAndApplyLevelUp(
      userProfile.level,
      newCurrentXp,
      maxXp
    );

    try {
      const updatedProfile = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        userProfile.$id,
        {
          level: newLevel,
          currentXp: updatedXp,
        }
      );
      setUserProfile(updatedProfile as UserProfile); // Fixed: Cast to UserProfile
      if (newLevel > userProfile.level) {
        toast.success(`Congratulations! You've leveled up to Level ${newLevel}!`);
      } else {
        toast.info(`You earned ${amount} XP!`);
      }
    } catch (error: any) {
      console.error("Error adding XP:", error);
      toast.error(error.message || "Failed to add XP.");
    }
  };

  const isAuthenticated = !!user;
  const isVerified = userProfile?.isVerified ?? false;

  return (
    <AuthContext.Provider value={{ user, userProfile, isLoading, isAuthenticated, isVerified, login, register, logout, updateUserProfile, addXp }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};