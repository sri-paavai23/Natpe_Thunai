"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const DailyQuestCard = () => {
  const [isQuestDialogOpen, setIsQuestDialogOpen] = useState(false);

  const handleViewQuest = () => {
    setIsQuestDialogOpen(true);
  };

  return (
    <>
      <Card className="bg-card text-card-foreground shadow-lg border-border">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-secondary-neon" /> Daily Quest
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 flex flex-col items-start">
          <p className="text-sm text-muted-foreground mb-3">Complete a quest today to earn XP and rewards!</p>
          <Button onClick={handleViewQuest} className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            View Quest
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isQuestDialogOpen} onOpenChange={setIsQuestDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-primary-foreground">Today's Daily Quest</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Here's what you need to do to earn your rewards!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-primary-foreground font-medium">Quest: List 2 items on The Exchange market.</p>
            <p className="text-sm text-muted-foreground">Reward: +50 XP, 100 Coins</p>
            <p className="text-sm text-muted-foreground">Status: In Progress</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DailyQuestCard;