"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { useTheme } from '../components/ThemeProvider'; // Import useTheme hook

const ProfilePage = () => {
  const { theme, toggleTheme } = useTheme(); // Use the theme hook

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-foreground">Profile Settings</CardTitle>
          <CardDescription className="text-center text-muted-foreground">Manage your account and preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-card p-4 rounded-lg shadow-md border border-border flex items-center justify-between">
            <Label htmlFor="dark-mode" className="text-foreground text-xl font-semibold">Dark Mode</Label>
            <Switch
              id="dark-mode"
              checked={theme === 'dark'} // Set checked based on current theme
              onCheckedChange={toggleTheme} // Toggle theme on change
            />
          </div>
          {/* Other profile settings can go here */}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;