"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Lock } from "lucide-react";

interface FeatureDetail {
  name: string;
  popupTitle: string;
  popupContent: string;
}

const upcomingFeaturesDetails: FeatureDetail[] = [
  {
    name: "Campus Drops",
    popupTitle: "The Gatekeeper of Cool.",
    popupContent:
      "Ever seen a limited-edition merch drop sell out in seconds online? Now, imagine that speed, but exclusively for your campus network. We are curating limited-time collaborations with your favorite streetwear, tech, and lifestyle brands that never hit general retail shelves. These aren't just discounts; they are access events. The Catch? It’s locked for outsiders. Available only inside the gate, to verified students. If you aren't fast, you aren't getting it. Prepare your wallets.",
  },
  {
    name: "Skill Wars",
    popupTitle: "Talk is Cheap. Show Your Work.",
    popupContent:
      "Tired of working for 'exposure'? It’s time to enter the arena. Skill Wars turns boring assignments into high-stakes battlegrounds. We are lining up local startups and major brands to drop real-world challenges right here—from designing a cafe's new poster to cracking a piece of code. You compete head-to-head against peers on your campus and beyond. The best entry doesn't just get a pat on the back; they win the cash pot and instant portfolio glory. Sharpen your skills; the war is coming.",
  },
  {
    name: "Travel Hacking",
    popupTitle: "Your Weekend Cheat Code.",
    popupContent:
      "Every Friday, the great migration home begins. Why are you still paying full price for the privilege of sitting in traffic? We aren't just another booking site. We are building the ultimate student travel command center. We’re developing exclusive cashback layers, 'squad booking' hacks for cheaper group rates, and rewards just for securing that bus or train seat you were going to buy anyway. Stop traveling like a civilian. Unlock the hack for your weekend commute.",
  },
  {
    name: "The Vault (Beta)",
    popupTitle: "Micro-Missions. Macro Rewards.",
    popupContent:
      "Forget those spammy 20-minute surveys that disqualify you at the last second. The Vault is built different. We are securing direct partnerships with cutting-edge AI companies and top-tier brands for high-value 'Micro-Missions.' Think training a next-gen voice AI using your local dialect, or getting paid to review an unreleased product prototype before it hits the market. These are quick, genuine tasks with real payouts. No fluff. Just straight value for your time. Access is currently restricted.",
  },
  {
    name: "Merchant Connect",
    popupTitle: "Your Campus, Connected.",
    popupContent:
      "Imagine your favorite local shops and eateries, right at your fingertips. Merchant Connect is bringing nearby businesses directly into your campus ecosystem. Merchants will gain a special role, allowing them to create exclusive listings in the Exchange tab—think unique student deals or campus-specific services. Plus, they'll be able to post daily food offerings in the Food & Wellness tab, making it easier than ever to discover delicious meals and support local businesses. Get ready for a whole new level of campus convenience!",
  },
];

const UnlockingSoonCard = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<FeatureDetail | null>(null);

  const handleFeatureClick = (feature: FeatureDetail) => {
    setSelectedFeature(feature);
    setIsDialogOpen(true);
  };

  return (
    <>
      <Card className="bg-card text-card-foreground shadow-lg border-border">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
            <Lock className="h-5 w-5 text-secondary-neon" /> Unlocking Soon
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-2">
          <p className="text-sm text-muted-foreground mb-4">
            Exciting new features are on their way to enhance your campus experience! Click to learn more.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {upcomingFeaturesDetails.slice(0, 4).map((feature, index) => (
              <Button
                key={index}
                variant="outline"
                className="flex items-center justify-start text-foreground text-sm h-auto py-2 px-3 bg-secondary-background hover:bg-secondary-background/80 border-secondary-neon/30 hover:border-secondary-neon"
                onClick={() => handleFeatureClick(feature)}
              >
                <Lock className="h-4 w-4 mr-2 text-secondary-neon" /> {feature.name}
              </Button>
            ))}
          </div>
          {upcomingFeaturesDetails.length > 4 && (
            <div className="flex justify-center mt-2">
              <Button
                key={4} // Index for the 5th item
                variant="outline"
                className="flex items-center justify-start text-foreground text-sm h-auto py-2 px-3 bg-secondary-background hover:bg-secondary-background/80 border-secondary-neon/30 hover:border-secondary-neon w-full sm:w-1/2"
                onClick={() => handleFeatureClick(upcomingFeaturesDetails[4])}
              >
                <Lock className="h-4 w-4 mr-2 text-secondary-neon" /> {upcomingFeaturesDetails[4].name}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedFeature && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-secondary-neon">{selectedFeature.popupTitle}</DialogTitle>
            </DialogHeader>
            <DialogDescription className="text-muted-foreground text-base leading-relaxed">
              {selectedFeature.popupContent}
            </DialogDescription>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default UnlockingSoonCard;