"use client";

import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarketListing } from "@/hooks/useMarketListings";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { ShoppingCart, Truck } from "lucide-react";
import BuyProductDialog from "./forms/BuyProductDialog"; // Assuming this component exists

interface MarketProductCardProps {
  product: MarketListing;
}

const MarketProductCard: React.FC<MarketProductCardProps> = ({ product }) => {
  const { user } = useAuth();
  const [isBuyDialogOpen, setIsBuyDialogOpen] = React.useState(false);

  const handleBuyClick = () => {
    if (!user) {
      toast.error("You must be logged in to buy/rent an item.");
      return;
    }
    if (user.$id === product.posterId) {
      toast.error("You cannot buy/rent your own listing.");
      return;
    }
    setIsBuyDialogOpen(true);
  };

  return (
    <Card className="bg-card text-card-foreground shadow-md border-border flex flex-col">
      <CardHeader className="p-4 pb-2 flex-grow">
        <CardTitle className="text-lg font-semibold text-card-foreground">{product.title}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-1">
        <p className="text-xs text-muted-foreground">Price: <span className="font-medium text-secondary-neon">{product.price}</span></p>
        {product.type === "rent" && (
          <p className="text-xs text-muted-foreground">Rental Period: <span className="font-medium text-foreground capitalize">{product.rentalPeriod}</span></p>
        )}
        <p className="text-xs text-muted-foreground">Condition: <span className="font-medium text-foreground capitalize">{product.condition.replace(/-/g, ' ')}</span></p>
        <p className="text-xs text-muted-foreground">Posted by: {product.posterName}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary" className="bg-muted text-muted-foreground capitalize">{product.category}</Badge>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 capitalize">
            {product.type}
          </Badge>
          {product.ambassadorDelivery && (
            <Badge variant="outline" className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
              <Truck className="h-3 w-3" /> Ambassador Delivery
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Dialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" onClick={handleBuyClick}>
              <ShoppingCart className="mr-2 h-4 w-4" /> {product.type === "sell" ? "Buy Now" : product.type === "rent" ? "Rent Now" : "Get Item"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">{product.type === "sell" ? "Buy" : product.type === "rent" ? "Rent" : "Get"} {product.title}</DialogTitle>
            </DialogHeader>
            <BuyProductDialog product={product} onClose={() => setIsBuyDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default MarketProductCard;