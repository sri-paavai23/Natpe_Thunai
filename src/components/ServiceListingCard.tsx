"use client";

import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServicePost } from "@/hooks/useServiceListings";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import BargainServiceDialog from "./forms/BargainServiceDialog";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface ServiceListingCardProps {
  service: ServicePost;
}

const ServiceListingCard: React.FC<ServiceListingCardProps> = ({ service }) => {
  const { user } = useAuth();
  const [isBargainDialogOpen, setIsBargainDialogOpen] = React.useState(false);

  const handleBargainClick = () => {
    if (!user) {
      toast.error("You must be logged in to bargain.");
      return;
    }
    if (user.$id === service.providerId) {
      toast.error("You cannot bargain on your own service.");
      return;
    }
    setIsBargainDialogOpen(true);
  };

  return (
    <Card className="bg-card text-card-foreground shadow-md border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg font-semibold text-card-foreground">{service.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-1">
        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
        <p className="text-xs text-muted-foreground mt-1">Price: <span className="font-medium text-secondary-neon">{service.price}</span></p>
        <p className="text-xs text-muted-foreground">Posted by: {service.providerName}</p>
        <p className="text-xs text-muted-foreground">Posted: {new Date(service.$createdAt).toLocaleDateString()}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary" className="bg-muted text-muted-foreground">{service.category}</Badge>
          {service.isCustomOrder && (
            <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
              Custom Order
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Dialog open={isBargainDialogOpen} onOpenChange={setIsBargainDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10" onClick={handleBargainClick}>
              Bargain
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Send Bargain Request</DialogTitle>
            </DialogHeader>
            <BargainServiceDialog service={service} onClose={() => setIsBargainDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default ServiceListingCard;