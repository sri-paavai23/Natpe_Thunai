"use client";

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import IndexPage from "./pages/Index";
import { Toaster } from "@/components/ui/sonner";
import MerchantDashboard from "./pages/MerchantDashboard"; // Import the new dashboard

// A simple private route component
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading authentication...</div>; // Or a spinner
  }

  return user ? <>{children}</> : <Navigate to="/auth" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <IndexPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/merchant-dashboard"
            element={
              <PrivateRoute>
                <MerchantDashboard />
              </PrivateRoute>
            }
          />
          {/* Add other private routes here */}
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;