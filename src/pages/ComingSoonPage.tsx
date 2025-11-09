"use client";

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const ComingSoonPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getTitle = () => {
    const path = location.pathname.split('/').pop();
    if (path) {
      return path.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    return "Feature";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold text-foreground mb-4">Coming Soon!</h1>
        <p className="text-xl text-muted-foreground mb-6">
          The <span className="text-secondary-neon font-semibold">{getTitle()}</span> feature is currently under development.
        </p>
        <p className="text-md text-muted-foreground mb-8">
          We're working hard to bring you exciting new content. Please check back later!
        </p>
        <Button onClick={() => navigate(-1)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    </div>
  );
};

export default ComingSoonPage;