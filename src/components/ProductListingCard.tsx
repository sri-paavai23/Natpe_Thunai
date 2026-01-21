"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Eye, ArrowRight } from "lucide-react";
import { Product } from "@/lib/mockData"; 
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface ProductListingCardProps {
  product: Product;
}

const ProductListingCard: React.FC<ProductListingCardProps> = ({ product }) => {
  const navigate = useNavigate();
  
  // Image State handling
  const [imageSrc, setImageSrc] = useState<string>("");
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (product.imageUrl && product.imageUrl.trim() !== "") {
        setImageSrc(product.imageUrl);
        setHasError(false);
    } else {
        setImageSrc("/app-logo.png");
        setHasError(true);
    }
  }, [product.imageUrl]);

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'sell': return "bg-blue-100 text-blue-700 border-blue-200";
      case 'rent': return "bg-purple-100 text-purple-700 border-purple-200";
      case 'gift': return "bg-pink-100 text-pink-700 border-pink-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleNavigateToDetails = () => {
    navigate(`/market/${product.$id}`);
  };

  return (
    <Card 
      onClick={handleNavigateToDetails}
      className="group flex flex-col h-full border border-border/60 hover:shadow-[0_0_20px_rgba(0,243,255,0.1)] hover:border-secondary-neon/50 transition-all duration-300 bg-card overflow-hidden cursor-pointer"
    >
      
      {/* IMAGE SECTION */}
      <div className="relative h-48 w-full bg-muted/30 overflow-hidden flex items-center justify-center">
        <img 
          src={imageSrc} 
          alt={product.title}
          className={cn(
            "w-full h-full transition-transform duration-700 group-hover:scale-105",
            hasError ? "object-contain p-10 opacity-80" : "object-cover"
          )}
          onError={() => { 
            setImageSrc("/app-logo.png");
            setHasError(true);
          }}
        />
        
        {!hasError && <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-40" />}

        <div className="absolute top-3 left-3">
          <Badge variant="outline" className={cn("capitalize text-[10px] font-bold tracking-wider shadow-sm backdrop-blur-md bg-white/90", getTypeBadgeStyle(product.type))}>
            {product.type}
          </Badge>
        </div>

        <div className="absolute bottom-3 right-3">
           <Badge className="bg-black/80 text-white border-0 backdrop-blur-md text-sm font-bold px-2.5 py-1 shadow-md">
             {product.price}
           </Badge>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <CardContent className="flex-grow p-4 space-y-3">
        <div className="space-y-1">
           <h3 className="font-bold text-lg leading-tight line-clamp-1 text-foreground group-hover:text-secondary-neon transition-colors">
             {product.title}
           </h3>
           {product.condition && (
             <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">
               Condition: <span className="text-foreground">{product.condition}</span>
             </p>
           )}
        </div>

        {product.location && (
          <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-secondary/5 p-2 rounded-md border border-border/50">
            <MapPin className="h-3.5 w-3.5 mt-0.5 text-secondary-neon shrink-0" />
            <span className="line-clamp-1 font-medium">{product.location}</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
          <Avatar className="h-6 w-6 border border-border">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${product.sellerName}`} />
            <AvatarFallback>S</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-foreground/90 truncate">
            {product.sellerName}
          </span>
        </div>
      </CardContent>

      {/* FOOTER ACTION - Centered and Larger */}
      <CardFooter className="p-4 pt-0">
        <Button 
            variant="outline" 
            className="w-full h-11 text-sm font-bold border-secondary-neon/20 bg-secondary-neon/5 text-secondary-neon hover:bg-secondary-neon hover:text-primary-foreground transition-all duration-300 rounded-xl group/btn"
            onClick={(e) => { 
              e.stopPropagation(); 
              handleNavigateToDetails(); 
            }}
        >
            <Eye className="mr-2 h-4 w-4" /> 
            View Details
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductListingCard;