"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Handshake } from "lucide-react"; // Import Handshake icon
import { account } from "@/lib/appwrite"; // Import Appwrite account service
import { useAuth } from "@/context/AuthContext"; // Import useAuth hook

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, login } = useAuth(); // Use AuthContext
  const [localLoading, setLocalLoading] = useState(true); // Local loading for splash screen delay

  useEffect(() => {
    // If AuthContext is still loading, wait for it
    if (isLoading) return;

    // Once AuthContext has determined auth status, handle redirection
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigate("/home", { replace: true });
      } else {
        navigate("/auth", { replace: true });
      }
    }, 1500); // Simulate a loading delay even after auth check

    return () => clearTimeout(timer);
  }, [isLoading, isAuthenticated, navigate]);

  // This component will only render its content if AuthContext is done loading
  // and after its own local loading delay.
  // The global AuthProvider handles the initial full-screen loading.
  // This local loading is just for the splash screen animation.
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setLocalLoading(false);
    }, 500); // Short delay for logo animation
    return () => clearTimeout(splashTimer);
  }, []);


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary to-background-dark text-primary-foreground">
      <img src="/app-logo.png" alt="Natpe🤝Thunai Logo" className="h-24 w-24 rounded-full object-cover mb-4 animate-fade-in" />
      <p className="text-4xl font-extrabold tracking-tight text-secondary-neon flex items-center gap-2">
        Natpe <Handshake className="h-8 w-8" /> Thunai
      </p>
      <p className="text-lg text-foreground mt-2">Creating communities and fostering friendships</p>
      {localLoading && <Loader2 className="h-8 w-8 animate-spin text-secondary-neon mt-6" />}
    </div>
  );
};

export default Index;