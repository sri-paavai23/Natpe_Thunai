"use client";

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { account } from "@/lib/appwrite";
import { APP_HOST_URL } from "@/lib/config"; // Import APP_HOST_URL

const VerificationBanner = () => {
  const { user, isVerified } = useAuth();
  const [loading, setLoading] = React.useState(false);

  if (isVerified) {
    return null;
  }

  const handleResendVerification = async () => {
    if (!user?.email) {
      toast.error("User email not found.");
      return;
    }
    setLoading(true);
    try {
      await account.createVerification(
        `${APP_HOST_URL}/verify-email` // Use dynamic URL
      );
      toast.success("Verification email resent! Please check your inbox.");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend verification email.");
      console.error("Resend verification error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-background sticky top-16 z-30 border-b border-border">
      <Alert className="bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-400 max-w-md mx-auto">
        <Mail className="h-4 w-4 text-yellow-500" />
        <AlertTitle className="text-yellow-600 dark:text-yellow-400 font-semibold">Email Verification Required</AlertTitle>
        <AlertDescription className="text-sm space-y-2">
          <p>Please check your email ({user?.email}) to verify your account and unlock full app features.</p>
          <Button
            onClick={handleResendVerification}
            disabled={loading}
            className="w-full bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-700 dark:hover:bg-yellow-600"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Resend Verification Link
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default VerificationBanner;