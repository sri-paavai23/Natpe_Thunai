"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { account } from "@/lib/appwrite";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await account.createRecovery(email, `http://localhost:8080/reset-password`); // Your reset password URL
      toast.success("Password reset email sent! Please check your inbox.");
      navigate("/auth"); // Redirect to login after sending email
    } catch (error: any) {
      toast.error(error.message || "Failed to send password reset email.");
      console.error("Password recovery error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-background-dark p-4">
      <Card className="w-full max-w-md bg-card text-foreground shadow-lg rounded-lg border-border animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-foreground">Forgot Password?</CardTitle>
          <CardDescription className="text-foreground">
            Enter your email to receive a password reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
              />
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200" disabled={loading}>
              {loading ? "Sending..." : <><Mail className="mr-2 h-4 w-4" /> Send Reset Link</>}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <Button variant="link" onClick={() => navigate("/auth")} className="p-0 h-auto text-secondary-neon hover:text-secondary-neon/80" disabled={loading}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;