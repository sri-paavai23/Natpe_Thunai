"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Train, Bus, Plane, ExternalLink } from "lucide-react";
import { toast } from "sonner";

const TicketBookingPage = () => {
  const handleRedirect = (platform: string, url: string) => {
    window.open(url, "_blank");
    toast.info(`Redirecting to ${platform}...`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Ticket Booking</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Train className="h-5 w-5 text-secondary-neon" /> Book Your Travel
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Quick links to popular platforms for train, bus, and flight bookings.
            </p>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleRedirect("IRCTC", "https://www.irctc.co.in/nget/train-search")}
            >
              <Train className="mr-2 h-4 w-4" /> IRCTC (Trains) <ExternalLink className="ml-auto h-4 w-4" />
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleRedirect("AbhiBus", "https://www.abhibus.com/")}
            >
              <Bus className="mr-2 h-4 w-4" /> AbhiBus (Buses) <ExternalLink className="ml-auto h-4 w-4" />
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleRedirect("Paytm Flights", "https://paytm.com/flights")}
            >
              <Plane className="mr-2 h-4 w-4" /> Paytm (Flights) <ExternalLink className="ml-auto h-4 w-4" />
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Disclaimer: External links. Natpe🤝Thunai is not responsible for content on partner sites.
            </p>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default TicketBookingPage;