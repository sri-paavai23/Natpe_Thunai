"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { useNavigate, Link } from "react-router-dom";
import DeveloperChatbox from "@/components/DeveloperChatbox";
import { useAuth } from "@/context/AuthContext";
import GraduationMeter from "@/components/GraduationMeter"; // NEW: Import GraduationMeter

const ProfilePage = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { logout, userProfile } = useAuth();

  const isDeveloper = userProfile?.role === "developer";

  const handleProfileSectionClick = (path: string, sectionName: string) => {
    toast.info(`Navigating to "${sectionName}"...`);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">My Zone (Profile)</h1>
      <div className="max-w-md mx-auto space-y-6">
        {/* NEW: Graduation Meter */}
        <GraduationMeter />

        <Card className="bg-card p-4 rounded-lg shadow-md border border-border cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleProfileSectionClick("/profile/details", "User Profile")}>
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">User Profile</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground">Manage verification badges, view your rating, and track your Level/XP progress.</p>
          </CardContent>
        </Card>
        <Card className="bg-card p-4 rounded-lg shadow-md border border-border cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleProfileSectionClick("/profile/wallet", "Wallet & Payments")}>
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Wallet & Payments</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground">Manage your wallet, payment methods, and view your dynamic commission policy.</p>
          </CardContent>
        </Card>
        <div className="bg-card p-4 rounded-lg shadow-md border border-border flex items-center justify-between">
          <Label htmlFor="dark-mode" className="text-foreground text-xl font-semibold">Dark Mode</Label>
          <Switch
            id="dark-mode"
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            className="data-[state=checked]:bg-secondary-neon data-[state=unchecked]:bg-muted-foreground"
          />
        </div>
        <DeveloperChatbox />
        {isDeveloper && (
          <Link to="/developer-dashboard">
            <Card className="bg-card p-4 rounded-lg shadow-md border border-border cursor-pointer hover:shadow-xl transition-shadow">
              <CardHeader className="p-0 pb-2">
                <CardTitle className="text-xl font-semibold text-card-foreground">Developer Dashboard</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <p className="text-muted-foreground">Manage transactions, commissions, and seller payments.</p>
              </CardContent>
            </Card>
          </Link>
        )}
        <Card className="bg-card p-4 rounded-lg shadow-md border border-border cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleProfileSectionClick("/profile/policies", "Policies")}>
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Policies</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground">Links to app policies, terms of service, and privacy statements.</p>
          </CardContent>
        </Card>
        <Button
          onClick={logout}
          className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          Log Out
        </Button>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ProfilePage;