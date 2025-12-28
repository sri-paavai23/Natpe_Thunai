import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Account, Client, Models, Databases, ID } from 'appwrite';
import { toast } from 'sonner';

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);

// Collection IDs (replace with your actual IDs)
const USER_PREFERENCES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USER_PREFERENCES_COLLECTION_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

export interface UserPreferences extends Models.Document { // Extend Models.Document
  name: string;
  yearOfStudy: 'I' | 'II' | 'III' | 'IV' | 'V';
  collegeName?: string;
  level: number;
  isDeveloper: boolean;
  isAmbassador: boolean;
  dailyQuestCompleted?: string; // Date string (ISO format)
  lastLoginStreakClaim?: string; // Date string (ISO format)
  ambassadorDeliveriesCount: number;
  profilePictureUrl?: string; // Added for consistency with Header.tsx
  // Add any other preferences here
}

export interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  isAuthenticated: boolean;
  isLoading: boolean; // Changed from 'loading' to 'isLoading'
  userProfile: UserPreferences | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>; // Changed from 'signup' to 'register'
  updateUserProfile: (preferences: Partial<UserPreferences>) => Promise<void>;
  incrementAmbassadorDeliveriesCount: () => Promise<void>;
  // Add other methods as needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Changed from 'loading' to 'isLoading'
  const [userProfile, setUserProfile] = useState<UserPreferences | null>(null);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const loggedInUser = await account.get();
      setUser(loggedInUser);
      setIsAuthenticated(true);

      // Fetch user preferences from the database
      let prefs: Partial<UserPreferences> = {};
      try {
        const prefsDoc = await databases.getDocument(
          DATABASE_ID,
          USER_PREFERENCES_COLLECTION_ID,
          loggedInUser.$id
        );
        prefs = prefsDoc as UserPreferences; // Type assertion is now safer as UserPreferences extends Models.Document
      } catch (docError: any) {
        console.warn("User preferences document not found, using defaults.", docError);
      }

      // Construct userProfile with defaults
      const profile: UserPreferences = {
        $id: loggedInUser.$id,
        $createdAt: loggedInUser.$createdAt,
        $updatedAt: loggedInUser.$updatedAt,
        $collectionId: USER_PREFERENCES_COLLECTION_ID,
        $databaseId: DATABASE_ID,
        $permissions: loggedInUser.$permissions, // Assuming permissions are inherited or set on creation
        name: loggedInUser.name,
        yearOfStudy: prefs.yearOfStudy || 'I',
        collegeName: prefs.collegeName || undefined,
        level: prefs.level || 1,
        isDeveloper: prefs.isDeveloper || false,
        isAmbassador: prefs.isAmbassador || false,
        dailyQuestCompleted: prefs.dailyQuestCompleted || undefined,
        lastLoginStreakClaim: prefs.lastLoginStreakClaim || undefined,
        ambassadorDeliveriesCount: prefs.ambassadorDeliveriesCount || 0,
        profilePictureUrl: prefs.profilePictureUrl || undefined,
      };
      setUserProfile(profile);

    } catch (error) {
      console.error("Failed to fetch user or preferences:", error);
      setUser(null);
      setIsAuthenticated(false);
      setUserProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await account.createEmailPasswordSession(email, password);
      await fetchUser();
      toast.success("Logged in successfully!");
    } catch (error: any) {
      toast.error(error.message || "Login failed.");
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
      setIsAuthenticated(false);
      setUserProfile(null);
      toast.success("Logged out successfully!");
    } catch (error: any) {
      toast.error(error.message || "Logout failed.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => { // Changed from 'signup'
    setIsLoading(true);
    try {
      const newUser = await account.create(ID.unique(), email, password, name);
      await account.createEmailPasswordSession(email, password);

      // Create initial user preferences document
      await databases.createDocument(
        DATABASE_ID,
        USER_PREFERENCES_COLLECTION_ID,
        newUser.$id, // Use user ID as document ID for 1:1 mapping
        {
          name: name,
          yearOfStudy: 'I',
          level: 1,
          isDeveloper: false,
          isAmbassador: false,
          ambassadorDeliveriesCount: 0,
          // Add other default preferences
        }
      );

      await fetchUser();
      toast.success("Account created and logged in!");
    } catch (error: any) {
      toast.error(error.message || "Registration failed.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (preferences: Partial<UserPreferences>) => {
    if (!userProfile?.$id) {
      toast.error("User profile not found for update.");
      return;
    }
    setIsLoading(true);
    try {
      await databases.updateDocument(
        DATABASE_ID,
        USER_PREFERENCES_COLLECTION_ID,
        userProfile.$id,
        preferences
      );
      // Optimistically update local state
      setUserProfile(prev => prev ? { ...prev, ...preferences } : null);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const incrementAmbassadorDeliveriesCount = async () => {
    if (!userProfile?.$id || !userProfile.isAmbassador) {
      toast.error("Not an ambassador or profile not found.");
      return;
    }
    setIsLoading(true);
    try {
      const newCount = (userProfile.ambassadorDeliveriesCount || 0) + 1;
      await databases.updateDocument(
        DATABASE_ID,
        USER_PREFERENCES_COLLECTION_ID,
        userProfile.$id,
        { ambassadorDeliveriesCount: newCount }
      );
      setUserProfile(prev => prev ? { ...prev, ambassadorDeliveriesCount: newCount } : null);
      toast.success("Ambassador delivery count updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update ambassador count.");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };


  const value = {
    user,
    isAuthenticated,
    isLoading,
    userProfile,
    login,
    logout,
    register,
    updateUserProfile,
    incrementAmbassadorDeliveriesCount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};