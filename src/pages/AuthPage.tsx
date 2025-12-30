"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { colleges } from "@/lib/colleges"; // Assuming you have a list of colleges
import { Link } from "react-router-dom";

export default function AuthPage() {
  const { login, register, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [isMerchant, setIsMerchant] = useState(false);
  const [merchantName, setMerchantName] = useState("");
  const [servedColleges, setServedColleges] = useState<string[]>([]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isMerchant && servedColleges.length === 0) {
      toast.error("Please select at least one college to serve.");
      return;
    }
    if (!isMerchant && !collegeName) {
      toast.error("Please select your college.");
      return;
    }

    const merchantData = isMerchant
      ? {
          merchantName,
          description: "Local Merchant",
          servedColleges,
        }
      : undefined;

    // For merchants, we can pass a placeholder for "collegeName" or their primary location
    await register(
      email,
      password,
      name,
      isMerchant ? "Merchant Account" : collegeName,
      "user",
      merchantData
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            {isLogin ? "Welcome Back!" : "Join Natpe🤝Thunai"}
          </h1>
          <p className="text-muted-foreground">
            {isLogin
              ? "Sign in to your account"
              : "Create your account to get started"}
          </p>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center space-x-2 my-4">
              <input
                type="checkbox"
                id="merchant-check"
                checked={isMerchant}
                onChange={(e) => setIsMerchant(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="merchant-check" className="text-sm font-medium">
                Register as Merchant Account
              </label>
            </div>

            {isMerchant ? (
              <div className="space-y-3 p-4 bg-muted rounded-md border border-border">
                <Label htmlFor="merchantName">Business Name</Label>
                <Input
                  id="merchantName"
                  placeholder="Your Business Name"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  required
                />
                <div className="space-y-2">
                  <Label className="text-sm">Select Colleges to Serve:</Label>
                  <div className="h-32 overflow-y-auto border rounded p-2 bg-background">
                    {colleges.map((col) => (
                      <div
                        key={col.id}
                        className="flex items-center space-x-2 mb-1"
                      >
                        <input
                          type="checkbox"
                          id={`college-${col.id}`}
                          value={col.id}
                          checked={servedColleges.includes(col.id)}
                          onChange={(e) => {
                            if (e.target.checked)
                              setServedColleges([...servedColleges, col.id]);
                            else
                              setServedColleges(
                                servedColleges.filter((id) => id !== col.id)
                              );
                          }}
                        />
                        <label htmlFor={`college-${col.id}`} className="text-sm">
                          {col.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Standard Student College Selection
              <div>
                <Label htmlFor="college">College</Label>
                <Select onValueChange={setCollegeName} required>
                  <SelectTrigger id="college">
                    <SelectValue placeholder="Select your college" />
                  </SelectTrigger>
                  <SelectContent>
                    {colleges.map((col) => (
                      <SelectItem key={col.id} value={col.name}>
                        {col.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Registering..." : "Sign Up"}
            </Button>
          </form>
        )}

        <div className="text-center text-sm text-muted-foreground">
          {isLogin ? (
            <>
              Don't have an account?{" "}
              <Link
                to="#"
                onClick={() => setIsLogin(false)}
                className="text-primary hover:underline"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                to="#"
                onClick={() => setIsLogin(true)}
                className="text-primary hover:underline"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}