"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const ActivityPage = () => {
  const navigate = useNavigate();

  const handleActivityClick = (path: string, activityName: string) => {
    toast.info(`Navigating to "${activityName}"...`);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">The Buzz (Activity)</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card p-4 rounded-lg shadow-md border border-border cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleActivityClick("/activity/tracking", "Tracking")}>
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Tracking</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground">Monitor orders, service status, cancellation requests, and complaint notes in one place.</p>
          </CardContent>
        </Card>
        <Card className="bg-card p-4 rounded-lg shadow-md border border-border cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleActivityClick("/activity/cash-exchange", "Cash Exchange")}>
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Cash Exchange</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground">Post requirements, accept deals, and contribute to the developers if you are benefited through this service (non-commissioned).</p>
          </CardContent>
        </Card>
        <Card className="bg-card p-4 rounded-lg shadow-md border border-border cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleActivityClick("/tournaments", "Tournament Updates")}>
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Tournament Updates</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground">Stay updated with esports dates, points tables, and winner announcements.</p>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ActivityPage;