"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const VerifyEmail: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>
            A verification link has been sent to your email address. Please check your inbox and click the link to activate your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            If you don't see the email, please check your spam folder.
          </p>
          <Button className="w-full" asChild>
            <Link to="/auth/login">Back to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;