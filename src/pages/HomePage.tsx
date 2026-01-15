"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import ProfileWidget from "@/components/ProfileWidget";
import QuickUpdatesBar from "@/components/QuickUpdatesBar";
import CanteenManagerWidget from "@/components/CanteenManagerWidget";
import DiscoveryFeed from "@/components/DiscoveryFeed";
import DailyQuestCard from "@/components/DailyQuestCard";
import LoginStreakCard from "@/components/LoginStreakCard";
import AnalyticsCard from "@/components/AnalyticsCard";
import { Zap, LayoutGrid } from "lucide-react";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-hidden">
      
      {/* --- Ambient Background Glow --- */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-secondary-neon/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* --- Sticky Header --- */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border/40 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-secondary-neon/20 p-1.5 rounded-lg">
               <Zap className="h-5 w-5 text-secondary-neon fill-current" />
            </div>
            <h1 className="text-xl font-black tracking-tighter italic">
              THE <span className="text-secondary-neon">HUB</span>
            </h1>
          </div>
          <div className="text-xs font-medium text-muted-foreground bg-secondary/10 px-2 py-1 rounded-full border border-secondary/20">
            Campus Live
          </div>
        </div>
      </header>

      <main className="p-4 pb-24 space-y-6 max-w-md mx-auto">
        
        {/* --- Section 1: Personal Dashboard --- */}
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <ProfileWidget />
           
           {/* Stats Grid: Analytics & Streak Side-by-Side */}
           <div className="grid grid-cols-2 gap-3">
              <div className="h-full">
                <AnalyticsCard />
              </div>
              <div className="h-full">
                <LoginStreakCard />
              </div>
           </div>
        </section>

        {/* --- Section 2: Updates Ticker --- */}
        <section className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
           <QuickUpdatesBar />
        </section>

        {/* --- Section 3: Daily Actions --- */}
        <section className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            <div className="flex items-center gap-2 mb-2">
                <LayoutGrid className="h-4 w-4 text-secondary-neon" />
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Zone Activities</h2>
            </div>
            
            <DailyQuestCard />
            <CanteenManagerWidget />
        </section>

        {/* --- Section 4: Discovery Feed --- */}
        <section className="pt-4 border-t border-border/50 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <DiscoveryFeed />
        </section>

      </main>

      <div className="relative z-10 pb-4">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default HomePage;