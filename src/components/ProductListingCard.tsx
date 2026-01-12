"use client";

import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin } from "lucide-react";
import { Product } from "@/lib/mockData"; 
import BuyProductDialog from "./forms/BuyProductDialog";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProductListingCardProps {
  product: Product;
}

const ProductListingCard: React.FC<ProductListingCardProps> = ({ product }) => {
  const { user } = useAuth();
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false);

  // Helper to determine badge color based on type
  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'sell': return "bg-blue-100 text-blue-700 border-blue-200";
      case 'rent': return "bg-purple-100 text-purple-700 border-purple-200";
      case 'gift': return "bg-pink-100 text-pink-700 border-pink-200";
      case 'sports': return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleContactClick = () => {
    if (!user) {
      toast.error("Please login to contact the seller.");
      return;
    }
    // In a real app, this would open a chat. For now, we show a toast.
    toast.info(`Contacting ${product.sellerName}...`);
  };

  return (
    <Card className="group flex flex-col h-full border border-border/60 hover:shadow-lg transition-all duration-300 bg-card overflow-hidden">
      
      {/* IMAGE SECTION */}
      <div className="relative h-40 w-full bg-muted overflow-hidden">
        <img 
          src={product.imageUrl || "/app-logo.png"} 
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = '/app-logo.png'; }}
        />
        
        {/* Type Badge */}
        <div className="absolute top-3 left-3">
          <Badge variant="outline" className={cn("capitalize text-[10px] font-bold tracking-wider shadow-sm backdrop-blur-md bg-white/90", getTypeBadgeStyle(product.type))}>
            {product.type}
          </Badge>
        </div>

        {/* Price Badge */}
        <div className="absolute bottom-3 right-3">
           <Badge className="bg-black/80 text-white border-0 backdrop-blur-md text-xs font-bold px-2 py-1 shadow-md">
             {product.price}
           </Badge>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <CardContent className="flex-grow p-4 space-y-3">
        
        {/* Title & Condition */}
        <div className="space-y-1">
           <h3 className="font-bold text-base leading-tight line-clamp-1 text-foreground group-hover:text-secondary-neon transition-colors">
             {product.title}
           </h3>
           {product.condition && (
             <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">
               Condition: <span className="text-foreground">{product.condition}</span>
             </p>
           )}
        </div>

        {/* Location (NEW FEATURE) */}
        {product.location && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-secondary/5 p-2 rounded-md border border-border/50">
            <MapPin className="h-3.5 w-3.5 mt-0.5 text-secondary-neon shrink-0" />
            <span className="line-clamp-1 font-medium">{product.location}</span>
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {/* Seller Info */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
          <Avatar className="h-6 w-6 border border-border">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${product.sellerName}`} />
            <AvatarFallback>S</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
             <span className="text-xs font-medium text-foreground/90 truncate max-w-[120px]">
               {product.sellerName}
             </span>
          </div>
        </div>
      </CardContent>

      {/* FOOTER ACTION */}
      <CardFooter className="p-3 bg-muted/20 border-t border-border/40 grid grid-cols-2 gap-2">
        {/* Buy/Rent Button */}
        {product.type !== 'gift' && (
            <Dialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen}>
            <DialogTrigger asChild>
                <Button 
                className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 h-8 text-xs font-bold shadow-sm"
                disabled={user?.$id === product.userId}
                >
                {product.type === 'rent' ? 'Rent Now' : 'Buy Now'}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader><DialogTitle>Confirm Purchase</DialogTitle></DialogHeader>
                <BuyProductDialog 
                product={product} 
                onPurchaseInitiated={() => setIsBuyDialogOpen(false)} 
                onCancel={() => setIsBuyDialogOpen(false)} 
                />
            </DialogContent>
            </Dialog>
        )}

        {/* Contact/Details Button (Takes full width if Gift) */}
        <Button 
            variant="outline" 
            className={cn("h-8 text-xs font-semibold border-border hover:bg-background", product.type === 'gift' ? "col-span-2" : "")}
            onClick={handleContactClick}
        >
            {product.type === 'gift' ? 'Claim Gift' : 'Contact'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductListingCard;