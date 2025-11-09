"use client";

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";

const MarketWarningBanner = () => {
  return (
    <Alert className="bg-destructive/10 border-destructive text-destructive-foreground">
      <TriangleAlert className="h-4 w-4 text-destructive" />
      <AlertTitle className="text-destructive font-semibold">Important Refund Policy</AlertTitle>
      <AlertDescription className="text-sm">
        Full refund required if product is damaged by the user within the return period. Please review our full policy for details.
      </AlertDescription>
    </Alert>
  );
};

export default MarketWarningBanner;