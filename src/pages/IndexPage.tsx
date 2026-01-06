"use client";

import React from 'react';
import { Link } from 'react-router-dom';

const IndexPage = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to the App!</h1>
      <p className="text-lg text-muted-foreground mb-8">This is your starting point. Explore the features.</p>
      <Link to="/profile" className="px-6 py-3 bg-primary text-primary-foreground rounded-md text-lg font-semibold hover:bg-primary/90 transition-colors">
        Go to Profile
      </Link>
    </div>
  );
};

export default IndexPage;