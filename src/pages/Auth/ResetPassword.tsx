"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ResetPassword: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" required />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Reset Password
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            <Link to="/auth/login" className="text-primary hover:underline">
              Back to Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;