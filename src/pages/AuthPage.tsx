"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner'; // Or your toast library

const AuthPage = () => {
  const navigate = useNavigate();
  const { login, register, user, isLoading } = useAuth();
  
  // Toggle between Login and Register mode
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  
  // Graduation Meter Logic State
  const [studyYear, setStudyYear] = useState("1");

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  // Logic to calculate graduation date based on selected year
  const calculateGradDate = () => {
    const date = new Date();
    // Logic: 1st Year = +4 yrs, 2nd Year = +3 yrs, 3rd Year = +2 yrs, Others = +1 yr
    const yearsToAdd = studyYear === '1' ? 4 : studyYear === '2' ? 3 : studyYear === '3' ? 2 : 1;
    date.setFullYear(date.getFullYear() + yearsToAdd);
    return date.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isLoginMode) {
        // --- LOGIN LOGIC ---
        await login(email, password);
        toast.success("Welcome back!");
      } else {
        // --- REGISTER LOGIC ---
        if (!name || !collegeName) {
            toast.error("Please fill in all details");
            return;
        }
        
        // Calculate the specific graduation date based on the dropdown
        const gradDate = calculateGradDate();

        await register(email, password, name, collegeName, gradDate);
        toast.success("Account created successfully!");
      }
      // Navigation is handled by the useEffect above
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Authentication failed");
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-8 space-y-6">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Natpe Thunai</h1>
          <p className="text-gray-500">
            {isLoginMode ? "Sign in to your account" : "Create your student account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* REGISTER-ONLY FIELDS */}
          {!isLoginMode && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">College Name</label>
                <input
                  type="text"
                  required
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Anna University"
                />
              </div>

              {/* GRADUATION YEAR DROPDOWN (The requested logic) */}
              <div className="space-y-2">
                <label htmlFor="year" className="text-sm font-medium">Current Year of Study</label>
                <select
                  id="year"
                  value={studyYear}
                  onChange={(e) => setStudyYear(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="1">I - First Year (4 years left)</option>
                  <option value="2">II - Second Year (3 years left)</option>
                  <option value="3">III - Third Year (2 years left)</option>
                  <option value="4">IV - Fourth Year (1 year left)</option>
                  <option value="5">V - Fifth Year (1 year left)</option>
                  <option value="other">Other</option>
                </select>
                <p className="text-xs text-gray-400">This calibrates your graduation meter.</p>
              </div>
            </>
          )}

          {/* COMMON FIELDS */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="student@college.edu"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition-colors"
          >
            {isLoginMode ? "Sign In" : "Register"}
          </button>
        </form>

        <div className="text-center text-sm">
          <button
            type="button"
            onClick={() => setIsLoginMode(!isLoginMode)}
            className="text-purple-600 hover:underline font-medium"
          >
            {isLoginMode 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;