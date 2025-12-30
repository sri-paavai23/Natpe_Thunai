"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
  const { login, register, loading, user } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  React.useEffect(() => {
    if (user) {
      navigate('/'); // Redirect to home if already logged in
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      try {
        await login(email, password);
        navigate('/');
      } catch (error) {
        // Error handled by toast in AuthContext
      }
    } else {
      try {
        await register(email, password, firstName, lastName);
        navigate('/');
      } catch (error) {
        // Error handled by toast in AuthContext
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background-dark p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg border border-border-dark">
        <h2 className="text-2xl font-bold text-center text-foreground">
          {isLogin ? 'Login' : 'Register'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
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
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <Button variant="link" onClick={() => setIsLogin(!isLogin)} disabled={loading}>
            {isLogin ? 'Register' : 'Login'}
          </Button>
        </p>
      </div>
    </div>
  );
};

export default AuthPage;