"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const IndexPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth(); // Fixed: Use isAuthenticated and isLoading from AuthContext
  const [localLoading, setLocalLoading] = useState(true); // Local loading for splash screen delay

  useEffect(() => {
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 2000); // Simulate a 2-second splash screen

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary-blue-light to-secondary-neon text-primary-foreground">
        <Loader2 className="h-16 w-16 animate-spin text-primary-foreground mb-4" />
        <h1 className="text-4xl font-bold">Natpe🤝Thunai</h1>
        <p className="text-lg mt-2">Connecting Campus Life</p>
        <MadeWithDyad className="mt-8" />
      </div>
    );
  }

  return null; // Should not render anything after redirection
};

export default IndexPage;