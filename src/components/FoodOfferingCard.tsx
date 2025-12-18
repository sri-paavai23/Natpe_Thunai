"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServicePost } from "@/hooks/useServiceListings";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PlaceFoodOrderForm from "./forms/PlaceFoodOrderForm";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface FoodOfferingCardProps {
  offering: ServicePost;
}

const FoodOfferingCard: React.FC<FoodOfferingCardProps> = ({ offering }) => {
  const { user } = useAuth();
  const [isOrderDialogOpen, setIsOrderDialogOpen] = React.useState(false);

  const handleOrderClick = () => {
    if (!user) {
      toast.error("You must be logged in to place an order.");
      return;
    }
    if (user.$id === offering.providerId) {
      toast.error("You cannot order your own offering.");
      return;
    }
    setIsOrderDialogOpen(true);
  };

  return (
    <Card className="bg-card text-card-foreground shadow-md border-border">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-card-foreground">{offering.title}</CardTitle>
          <CardDescription className="text-secondary-neon font-bold text-md">{offering.price}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-1">
        <p className="text-sm text-muted-foreground line-clamp-3">{offering.description}</p>
        <p className="text-xs text-muted-foreground">Provider: {offering.providerName}</p>
        <p className="text-xs text-muted-foreground">Contact: {offering.contact}</p>
        {offering.ambassadorDelivery && (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 mt-2">
            Ambassador Delivery Available
          </Badge>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" onClick={handleOrderClick}>
              Place Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Place Order for {offering.title}</DialogTitle>
            </DialogHeader>
            <PlaceFoodOrderForm offering={offering} onClose={() => setIsOrderDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default FoodOfferingCard;