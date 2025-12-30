"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const Login: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-foreground">Login</h2>
        <form className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required />
          </div>
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/auth/sign-up" className="text-primary hover:underline">
            Sign Up
          </Link>
        </p>
        <p className="text-center text-sm text-muted-foreground">
          <Link to="/auth/forgot-password" className="text-primary hover:underline">
            Forgot Password?
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;