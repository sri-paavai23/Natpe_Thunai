"use client";

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Terminal, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const VerificationBanner = () => {
  const { user, isVerified, updateUserProfile } = useAuth(); // Fixed: Use isVerified from AuthContext
  const [loading, setLoading] = React.useState(false);

  if (!user || isVerified) {
    return null; // Don't show if not logged in or already verified
  }

  const handleResendVerification = async () => {
    setLoading(true);
    try {
      // In a real Appwrite setup, you'd typically send an email verification link
      // await account.createVerification(user.$id);
      toast.info("Verification email resent (simulated). Please check your inbox.");
    } catch (error: any) {
      console.error("Error resending verification:", error);
      toast.error(error.message || "Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsVerified = async () => {
    setLoading(true);
    try {
      // This is a placeholder for an admin action or a more robust verification flow
      // For now, we'll simulate marking the user as verified directly.
      await updateUserProfile({ isVerified: true });
      toast.success("Your account has been verified!");
    } catch (error: any) {
      console.error("Error marking as verified:", error);
      toast.error(error.message || "Failed to mark as verified.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Alert className="bg-yellow-100 border-yellow-400 text-yellow-800 flex items-center justify-between p-3">
      <div className="flex items-center">
        <Terminal className="h-4 w-4 mr-2" />
        <div>
          <AlertTitle className="text-sm font-semibold">Account Not Verified</AlertTitle>
          <AlertDescription className="text-xs">
            Please verify your college ID to unlock all features.
          </AlertDescription>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResendVerification}
          disabled={loading}
          className="border-yellow-600 text-yellow-800 hover:bg-yellow-200"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Resend Email"}
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={handleMarkAsVerified}
          disabled={loading}
          className="bg-yellow-600 text-white hover:bg-yellow-700"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Mark as Verified (Dev Only)"}
        </Button>
      </div>
    </Alert>
  );
};

export default VerificationBanner;