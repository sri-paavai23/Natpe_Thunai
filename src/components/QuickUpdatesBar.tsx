"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Package, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const QuickUpdatesBar = () => {
  const navigate = useNavigate();

  const handleAction = (actionType: string) => {
    switch (actionType) {
      case "list-item":
        toast.info("Navigating to Market to list an item...");
        navigate("/market?action=list-sell");
        break;
      case "cash-exchange":
        toast.info("Navigating to Cash Exchange section...");
        navigate("/activity/cash-exchange");
        break;
      default:
        toast.info(`"${actionType}" feature coming soon!`);
    }
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      {/* Used 'justify-evenly' to center the two buttons nicely with equal spacing */}
      <CardContent className="p-4 flex justify-evenly items-center gap-2">
        <Button
          variant="ghost"
          className="flex flex-col items-center gap-1 text-foreground hover:bg-primary/10 hover:text-secondary-neon min-w-[100px]"
          onClick={() => handleAction("list-item")}
        >
          <Package className="h-6 w-6" />
          <span className="text-xs font-medium">List an Item</span>
        </Button>
        
        <div className="h-8 w-[1px] bg-border opacity-50"></div> {/* Optional divider for aesthetics */}

        <Button
          variant="ghost"
          className="flex flex-col items-center gap-1 text-foreground hover:bg-primary/10 hover:text-secondary-neon min-w-[100px]"
          onClick={() => handleAction("cash-exchange")}
        >
          <DollarSign className="h-6 w-6" />
          <span className="text-xs font-medium">Cash Exchange</span>
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickUpdatesBar;