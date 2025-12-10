"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { MadeWithDyad } from '@/components/made-with-dyad';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20 flex flex-col items-center justify-center text-center">
      <h1 className="text-6xl font-bold text-secondary-neon mb-4">404</h1>
      <h2 className="text-3xl font-semibold text-foreground mb-4">Page Not Found</h2>
      <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist or an error occurred.</p>
      <Link to="/home">
        <button className="bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors">
          Go to Home
        </button>
      </Link>
      <MadeWithDyad />
    </div>
  );
};

export default NotFoundPage;