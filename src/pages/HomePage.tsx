"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import ProfileWidget from "@/components/ProfileWidget";
import QuickUpdatesBar from "@/components/QuickUpdatesBar";
import CanteenManagerWidget from "@/components/CanteenManagerWidget";
import DiscoveryFeed from "@/components/DiscoveryFeed";
import DailyQuestCard from "@/components/DailyQuestCard";
import LoginStreakCard from "@/components/LoginStreakCard";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">The Hub (Home)</h1>
      <div className="max-w-md mx-auto space-y-6">
        <ProfileWidget />

        <QuickUpdatesBar />

        <CanteenManagerWidget />

        <DiscoveryFeed />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DailyQuestCard />
          <LoginStreakCard />
        </div>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default HomePage;