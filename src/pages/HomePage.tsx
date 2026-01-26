"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import ProfileWidget from "@/components/ProfileWidget";
import QuickUpdatesBar from "@/components/QuickUpdatesBar";
import CanteenManagerWidget from "@/components/CanteenManagerWidget";
import DailyQuestCard from "@/components/DailyQuestCard";
import LoginStreakCard from "@/components/LoginStreakCard";
import AnalyticsCard from "@/components/AnalyticsCard";

// 1. IMPORT COMMENTED OUT TO PREVENT UNNECESSARY LOADING
// import DiscoveryFeed from "@/components/DiscoveryFeed"; 

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-24 relative overflow-x-hidden">
      
      {/* HUB HEADER */}
      <div className="max-w-md mx-auto mb-8 text-center">
        <h1 className="text-4xl font-black italic tracking-tighter uppercase">
          THE <span className="text-secondary-neon">HUB</span>
        </h1>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em] opacity-60">
          Command Center • v1.0 Alpha
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        
        {/* Identity & Profile Stats */}
        <ProfileWidget />

        {/* Real-time App Updates */}
        <QuickUpdatesBar />
        
        {/* Performance Analytics (New) */}
        <AnalyticsCard /> 

        {/* Food & Canteen Management */}
        <CanteenManagerWidget />

        {/* 2. COMPONENT COMMENTED OUT BELOW
          Discovery Feed logic is being polished. 
          Uncomment the lines below when the algorithm is ready.
        */}
        {/* <DiscoveryFeed /> */}

        {/* Rewards & Daily Engagement */}
        <div className="grid grid-cols-2 gap-4">
          <DailyQuestCard />
          <LoginStreakCard />
        </div>
        
      </div>

      <MadeWithDyad />
    </div>
  );
};

export default HomePage;