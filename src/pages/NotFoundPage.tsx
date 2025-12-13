"use client";

import React from 'react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen p-4 bg-background text-foreground flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-destructive">404</h1>
      <p className="text-xl text-muted-foreground">Page Not Found</p>
      <p className="mt-4 text-center text-foreground">The page you are looking for does not exist.</p>
    </div>
  );
};

export default NotFoundPage;