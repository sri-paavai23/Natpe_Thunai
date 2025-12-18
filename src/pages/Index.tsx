"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext"; // Use AuthContext
import { Loader2 } from "lucide-react";

const IndexPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth(); // Use AuthContext
  const [localLoading, setLocalLoading] = useState(true); // Local loading for splash screen delay

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 1500); // Simulate a splash screen for 1.5 seconds

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && !localLoading) {
      if (isAuthenticated) {
        navigate("/home");
      } else {
        navigate("/auth");
      }
    }
  }, [isAuthenticated, isLoading, localLoading, navigate]);

  if (isLoading || localLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-secondary-neon" />
        <p className="ml-3 text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return null; // Should not be reached as navigation happens in useEffect
};

export default IndexPage;