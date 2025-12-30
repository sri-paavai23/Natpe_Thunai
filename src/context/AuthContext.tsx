"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { account, databases, ID, Query, APPWRITE_DATABASE_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from '@/lib/appwrite';
import { Models } from 'appwrite';
import { toast } from 'sonner';

// Define UserProfile type based on your Appwrite collection structure
export interface UserProfile extends Models.Document {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  collegeIdPhotoId?: string;
  isCollegeIdVerified: boolean;
  level: number;
  xp: number;
  userType: 'student' | 'staff' | 'merchant' | 'ambassador';
  role: 'user' | 'developer'; // 'user' or 'developer'
  ambassadorDeliveriesCount: number;
  collegeId?: string; // Added collegeId
  collegeName?: string; // Added collegeName
  itemsListedToday?: number; // For DailyQuestCard
  lastQuestCompletedDate?: string; // For DailyQuestCard
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say'; // For ProfileWidget
  avatarStyle?: string; // For ProfileWidget
  age?: number; // For age-gated content
  mobileNumber?: string; // For ProfileDetailsPage
  upiId?: string; // For ProfileDetailsPage
  currentXp?: number; // For ProfileWidget (if different from xp)
  maxXp?: number; // For ProfileWidget
}

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  userProfile: UserProfile | null;
  isVerified: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  addXp: (amount: number) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>; // Updated signature
  recordMarketListing: (listingType: 'product' | 'service' | 'errand' | 'cash_exchange' | 'collaborator') => Promise<void>;
  incrementAmbassadorDeliveriesCount: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUserProfile = async (userId: string) => {
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );
      if (response.documents.length > 0) {
        const profile = response.documents[0] as unknown as UserProfile; // Cast to unknown first
        setUserProfile(profile);
        setIsVerified(profile.isCollegeIdVerified || false);
      } else {
        setUserProfile(null);
        setIsVerified(false);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setUserProfile(null);
      setIsVerified(false);
    }
  };

  const checkSession = async () => {
    setLoading(true);
    try {
      const currentUser = await account.get();
      setUser(currentUser);
      await fetchUserProfile(currentUser.$id);
    } catch (error) {
      setUser(null);
      setUserProfile(null);
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await account.createEmailPasswordSession(email, password);
      await checkSession();
      toast.success("Logged in successfully!");
    } catch (error: any) {
      toast.error(error.message || "Login failed.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    setLoading(true);
    try {
      const newUser = await account.create(ID.unique(), email, password, `${firstName} ${lastName}`);
      await account.createEmailPasswordSession(email, password);

      // Create initial user profile
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        ID.unique(),
        {
          userId: newUser.$id,
          firstName,
          lastName,
          email,
          isCollegeIdVerified: false,
          level: 1,
          xp: 0,
          userType: 'student', // Default user type
          role: 'user', // Default role
          ambassadorDeliveriesCount: 0,
          // Add other default profile fields here
          gender: 'prefer-not-to-say',
          avatarStyle: 'lorelei',
          age: 18, // Default age
          mobileNumber: '',
          upiId: '',
          collegeId: '',
          collegeName: '',
          itemsListedToday: 0,
          lastQuestCompletedDate: '',
          currentXp: 0,
          maxXp: 100,
        }
      );
      await checkSession();
      toast.success("Account created and logged in!");
    } catch (error: any) {
      toast.error(error.message || "Registration failed.");
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await account.deleteSession('current');
      setUser(null);
      setUserProfile(null);
      setIsVerified(false);
      toast.info("Logged out successfully.");
    } catch (error: any) {
      toast.error(error.message || "Logout failed.");
    } finally {
      setLoading(false);
    }
  };

  const addXp = async (amount: number) => {
    if (!userProfile || !user) {
      toast.error("User not logged in or profile not found.");
      return;
    }
    try {
      const newXp = (userProfile.xp || 0) + amount;
      // Implement level-up logic here if needed
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        userProfile.$id,
        { xp: newXp }
      );
      setUserProfile(prev => prev ? { ...prev, xp: newXp } : null);
      toast.success(`Gained ${amount} XP!`);
    } catch (error: any) {
      console.error("Error adding XP:", error);
      toast.error("Failed to add XP.");
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => { // Updated signature
    if (!userProfile || !user) {
      toast.error("User not logged in or profile not found.");
      return;
    }
    try {
      const updatedProfile = await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        userProfile.$id,
        data
      );
      setUserProfile(updatedProfile as unknown as UserProfile); // Cast to unknown first
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating user profile:", error);
      toast.error("Failed to update profile.");
    }
  };

  const recordMarketListing = async (listingType: 'product' | 'service' | 'errand' | 'cash_exchange' | 'collaborator') => {
    if (!userProfile || !user) {
      toast.error("User not logged in or profile not found.");
      return;
    }
    // Placeholder for recording market listings.
    // This would typically involve updating a counter or a list in the user's profile
    // or a separate collection. For now, just a toast.
    toast.info(`Recorded a new ${listingType} listing.`);
    // Example: addXp(10); // Grant XP for listing
  };

  const incrementAmbassadorDeliveriesCount = async () => {
    if (!userProfile || !user || userProfile.userType !== 'ambassador') {
      toast.error("Only ambassadors can increment delivery count.");
      return;
    }
    try {
      const newCount = (userProfile.ambassadorDeliveriesCount || 0) + 1;
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        userProfile.$id,
        { ambassadorDeliveriesCount: newCount }
      );
      setUserProfile(prev => prev ? { ...prev, ambassadorDeliveriesCount: newCount } : null);
      toast.success("Ambassador delivery count incremented!");
    } catch (error: any) {
      console.error("Error incrementing ambassador deliveries:", error);
      toast.error("Failed to increment ambassador deliveries.");
    }
  };

  const value = {
    user,
    userProfile,
    isVerified,
    loading,
    login,
    register,
    logout,
    checkSession,
    addXp,
    updateUserProfile,
    recordMarketListing,
    incrementAmbassadorDeliveriesCount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};