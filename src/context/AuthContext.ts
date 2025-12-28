"use client";

import React, { createContext, useState, useEffect } from 'react';

interface AuthContextInterface {
  user: any;
  userProfile: any;
  login: (user: any) => void;
  logout: () => void;
  addXp: (amount: number) => void;
  updateUserProfile: (updates: any) => void;
  incrementAmbassadorDeliveriesCount: () => void;
  recordMarketListing: (listing: any) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextInterface>({
  user: null,
  userProfile: null,
  login: () => {},
  logout: () => {},
  addXp: () => {},
  updateUserProfile: () => {},
  incrementAmbassadorDeliveriesCount: () => {},
  recordMarketListing: () => {},
  isLoading: false,
});

const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = (user: any) => {
    setUser(user);
  };

  const logout = () => {
    setUser(null);
  };

  const addXp = (amount: number) => {
    // Implement addXp logic here
  };

  const updateUserProfile = (updates: any) => {
    // Implement updateUserProfile logic here
  };

  const incrementAmbassadorDeliveriesCount = () => {
    // Implement incrementAmbassadorDeliveriesCount logic here
  };

  const recordMarketListing = (listing: any) => {
    // Implement recordMarketListing logic here
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      login,
      logout,
      addXp,
      updateUserProfile,
      incrementAmbassadorDeliveriesCount,
      recordMarketListing,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider, AuthContext };