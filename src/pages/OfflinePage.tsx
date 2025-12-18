"use client";

import React from "react";
import CosmicDashGame from "@/components/CosmicDashGame"; // Updated import
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const OfflinePage = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4 text-center">
      <div className="max-w-md mx-auto space-y-8">
        <div className="relative">
          <img 
            src="/no-internet.jpg" 
            alt="No Internet Connection" 
            className="w-full h-auto max-h-80 object-contain"
          />
          <h1 className="text-2xl font-bold mt-4 text-foreground">Lost Connection</h1>
          <p className="text-lg text-muted-foreground">
            Check your connection or try again.
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleRefresh} 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Try Reconnecting
          </Button>
          
          <h2 className="text-xl font-semibold text-secondary-neon">Play Cosmic Dash!</h2>
          <CosmicDashGame />
          <p className="text-sm text-muted-foreground">
            A mini-game to keep you entertained while you wait for the network to return.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflinePage;