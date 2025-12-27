"use client";

import React from 'react';
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Outlet } from "react-router-dom"; // Import Outlet
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  // children is no longer directly used here, as Outlet handles rendering nested routes.
  // We can remove it from the interface if it's not used elsewhere.
  // For now, keeping it as React.ReactNode is fine, but it won't be explicitly rendered.
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = () => { // Removed children from props
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-secondary-neon" />
        <p className="ml-3 text-lg text-muted-foreground">Loading user session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/auth", { replace: true });
    return null;
  }

  return <Outlet />; // Render nested routes using Outlet
};

export default ProtectedRoute;