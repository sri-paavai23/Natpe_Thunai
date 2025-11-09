"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { account } from "@/lib/appwrite";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");

    const verify = async () => {
      if (!userId || !secret) {
        setStatus("error");
        setMessage("Invalid verification link.");
        toast.error("Invalid verification link.");
        return;
      }

      try {
        await account.updateVerification(userId, secret);
        setStatus("success");
        setMessage("Email verified successfully! You can now log in.");
        toast.success("Email verified successfully!");
      } catch (error: any) {
        setStatus("error");
        setMessage(`Email verification failed: ${error.message}`);
        toast.error(`Email verification failed: ${error.message}`);
        console.error("Email verification error:", error);
      }
    };

    verify();
  }, [searchParams]);

  const handleRedirectToLogin = () => {
    navigate("/auth", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="text-center max-w-md space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-secondary-neon mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">{message}</h1>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">{message}</h1>
            <Button onClick={handleRedirectToLogin} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Go to Login
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="h-10 w-10 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Verification Failed</h1>
            <p className="text-muted-foreground">{message}</p>
            <Button onClick={handleRedirectToLogin} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Go to Login
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;