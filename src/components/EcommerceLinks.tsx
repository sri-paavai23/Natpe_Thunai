"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const EcommerceLinks = () => {
  const handleRedirect = (platform: string, url: string) => {
    window.open(url, "_blank");
    // toast.info(`Redirecting to ${platform}...`); // Optional: add toast
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground">E-commerce Partners</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <p className="text-sm text-muted-foreground">
          Explore more products on our partner platforms.
        </p>
        <div className="flex justify-around gap-4">
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => handleRedirect("Amazon", "https://www.amazon.in")}
          >
            Amazon <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => handleRedirect("Flipkart", "https://www.flipkart.com")}
          >
            Flipkart <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Disclaimer: External links. Natpe🤝Thunai is not responsible for content on partner sites.
        </p>
      </CardContent>
    </Card>
  );
};

export default EcommerceLinks;