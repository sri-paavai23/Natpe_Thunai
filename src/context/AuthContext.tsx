"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { account, databases, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from '@/lib/appwrite';
import { Models, Query } from 'appwrite';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: Models.User<Models.Preferences> | null;
  userProfile: any | null; // Added userProfile
  isVerified: boolean; // Added isVerified
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // Placeholder functions to resolve TS errors
  addXp: (amount: number) => Promise<void>;
  updateUserProfile: (data: any) => Promise<void>;
  recordMarketListing: (listingData: any) => Promise<void>;
  incrementAmbassadorDeliveriesCount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null); // State for user profile
  const [isVerified, setIsVerified] = useState(false); // State for verification status

  useEffect(() => {
    const checkUserSession = async () => {
      setIsLoading(true);
      try {
        const user = await account.get();
        setCurrentUser(user);
        setIsAuthenticated(true);

        // Fetch user profile
        const profileResponse = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_USER_PROFILES_COLLECTION_ID,
          [Query.equal('userId', user.$id)]
        );
        if (profileResponse.documents.length > 0) {
          setUserProfile(profileResponse.documents[0]);
          setIsVerified(profileResponse.documents[0].isVerified || false); // Assuming isVerified exists on profile
        } else {
          setUserProfile(null);
          setIsVerified(false);
        }

      } catch (error) {
        setCurrentUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);
        setIsVerified(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkUserSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await account.createEmailPasswordSession(email, password);
      const user = await account.get();
      setCurrentUser(user);
      setIsAuthenticated(true);

      // Fetch user profile after login
      const profileResponse = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.equal('userId', user.$id)]
      );
      if (profileResponse.documents.length > 0) {
        setUserProfile(profileResponse.documents[0]);
        setIsVerified(profileResponse.documents[0].isVerified || false);
      } else {
        setUserProfile(null);
        setIsVerified(false);
      }

    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await account.deleteSession('current');
      setCurrentUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      setIsVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Placeholder implementations for new functions
  const addXp = async (amount: number) => {
    console.log(`Adding ${amount} XP (placeholder)`);
    // Implement actual XP logic here, e.g., update user profile in Appwrite
  };

  const updateUserProfile = async (data: any) => {
    console.log("Updating user profile (placeholder)", data);
    // Implement actual profile update logic here
  };

  const recordMarketListing = async (listingData: any) => {
    console.log("Recording market listing (placeholder)", listingData);
    // Implement actual market listing recording logic here
  };

  const incrementAmbassadorDeliveriesCount = async () => {
    console.log("Incrementing ambassador deliveries count (placeholder)");
    // Implement actual ambassador deliveries count logic here
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      currentUser,
      userProfile,
      isVerified,
      login,
      logout,
      addXp,
      updateUserProfile,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};