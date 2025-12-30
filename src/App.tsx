"use client";

import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";

// Layouts
import MainLayout from "@/components/layout/MainLayout";

// Pages
import Index from "@/pages/Index";
import Login from "@/pages/Auth/Login";
import SignUp from "@/pages/Auth/SignUp";
import VerifyEmail from "@/pages/Auth/VerifyEmail";
import ForgotPassword from "@/pages/Auth/ForgotPassword";
import ResetPassword from "@/pages/Auth/ResetPassword";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Exchange from "@/pages/Exchange";
import FoodAndWellness from "@/pages/FoodAndWellness";
import Canteen from "@/pages/Canteen";
import CashExchange from "@/pages/CashExchange";
import Services from "@/pages/Services";
import Errands from "@/pages/Errands";
import Collaborators from "@/pages/Collaborators";
import Tournaments from "@/pages/Tournaments";
import DeveloperMessages from "@/pages/DeveloperMessages";
import AmbassadorApplications from "@/pages/AmbassadorApplications";
import Reports from "@/pages/Reports";
import MissingColleges from "@/pages/MissingColleges";
import LostAndFound from "@/pages/LostAndFound";
import MerchantDashboard from "@/pages/MerchantDashboard"; // Import the new MerchantDashboard

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading authentication...</div>; // Or a spinner
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/auth/login" />;
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Toaster richColors position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/sign-up" element={<SignUp />} />
          <Route path="/auth/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />

          {/* Private Routes (require authentication) */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Index />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="exchange" element={<Exchange />} />
            <Route path="food-and-wellness" element={<FoodAndWellness />} />
            <Route path="canteen" element={<Canteen />} />
            <Route path="cash-exchange" element={<CashExchange />} />
            <Route path="services" element={<Services />} />
            <Route path="errands" element={<Errands />} />
            <Route path="collaborators" element={<Collaborators />} />
            <Route path="tournaments" element={<Tournaments />} />
            <Route path="developer-messages" element={<DeveloperMessages />} />
            <Route path="ambassador-applications" element={<AmbassadorApplications />} />
            <Route path="reports" element={<Reports />} />
            <Route path="missing-colleges" element={<MissingColleges />} />
            <Route path="lost-and-found" element={<LostAndFound />} />
            <Route path="merchant/dashboard" element={<MerchantDashboard />} /> {/* New Merchant Dashboard Route */}
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;