"use client";

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { account } from "@/lib/appwrite"; // Assuming account is exported from appwrite.ts

const VerificationBanner = () => {
  const { user, isVerified } = useAuth();
  const [loading, setLoading] = React.useState(false);

  const handleResendVerification = async () => {
    if (!user) {
      toast.error("No user logged in.");
      return;
    }
    setLoading(true);
    try {
      await account.createVerification("https://your-app-domain.com/verify"); // Replace with your actual verification URL
      toast.success("Verification email sent! Please check your inbox.");
    } catch (error: any) {
      console.error("Error resending verification:", error);
      toast.error(error.message || "Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  if (!user || isVerified) {
    return null; // Don't show if not logged in or already verified
  }

  return (
    <div className="w-full bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-3 text-center">
      <Alert className="bg-transparent border-none text-yellow-800 dark:text-yellow-200">
        <Info className="h-4 w-4 text-yellow-800 dark:text-yellow-200" />
        <AlertTitle className="text-yellow-800 dark:text-yellow-200">Email Verification Required</AlertTitle>
        <AlertDescription className="flex items-center justify-center space-x-2 text-yellow-800 dark:text-yellow-200">
          <span>Please verify your email address to unlock all features.</span>
          <Button
            variant="link"
            onClick={handleResendVerification}
            disabled={loading}
            className="text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 p-0 h-auto"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Resend Verification"}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default VerificationBanner;