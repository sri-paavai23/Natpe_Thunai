"use client";

import React, { createContext, useState } from 'react';

interface AuthContextProps {
  children: React.ReactNode;
}

interface AuthContextType {
  user: any;
  userProfile: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  isVerified: boolean;
  login: (user: any) => void;
  logout: () => void;
  addXp: (xp: number) => void;
  updateUserProfile: (profile: any) => void;
  incrementAmbassadorDeliveriesCount: () => void;
  recordMarketListing: (listing: any) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  isAuthenticated: false,
  isLoading: false,
  isVerified: false,
  login: () => {},
  logout: () => {},
  addXp: () => {},
  updateUserProfile: () => {},
  incrementAmbassadorDeliveriesCount: () => {},
  recordMarketListing: () => {},
});

const AuthProvider = ({ children }: AuthContextProps) => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const login = (user: any) => {
    setUser(user);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const addXp = (xp: number) => {
    // Implement XP addition logic here
  };

  const updateUserProfile = (profile: any) => {
    setUserProfile(profile);
  };

  const incrementAmbassadorDeliveriesCount = () => {
    // Implement increment ambassador deliveries count logic here
  };

  const recordMarketListing = (listing: any) => {
    // Implement record market listing logic here
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      isAuthenticated,
      isLoading,
      isVerified,
      login,
      logout,
      addXp,
      updateUserProfile,
      incrementAmbassadorDeliveriesCount,
      recordMarketListing,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => React.useContext(AuthContext);

export { AuthProvider, AuthContext };