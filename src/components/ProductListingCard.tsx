"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProductListingCardProps {
  $id: string; // Changed to $id
  imageUrl: string;
  title: string;
  price: string;
  sellerRating: number;
  sellerBadge?: string;
  type: "sell" | "rent" | "gift" | "sports" | "gift-request";
  description: string;
  damages?: string;
  policies?: string;
  condition?: string;
  sellerId: string; // Added for consistency
  sellerName: string; // Added for consistency
  onDeveloperDelete?: (productId: string) => void;
}

const ProductListingCard: React.FC<ProductListingCardProps> = ({
  $id, // Use $id here
  imageUrl,
  title,
  price,
  sellerRating,
  sellerBadge,
  type,
  description,
  damages,
  policies,
  condition,
  sellerId, // Destructure sellerId
  sellerName, // Destructure sellerName
  onDeveloperDelete,
}) => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const isDeveloper = userProfile?.role === "developer";

  const handleBuyRent = (e: React.MouseEvent) => {
    e.stopPropagation();
    let actionText = "";
    if (type === "sell") actionText = "purchased";
    else if (type === "rent") actionText = "rented";
    else if (type === "gift") actionText = "claimed";
    else if (type === "sports") actionText = "purchased";
    else if (type === "gift-request") actionText = "accepted request for";

    toast.info(`Initiating ${actionText} for "${title}". Redirecting to payment...`);
    navigate(`/market/product/${$id}`); // Use $id here
  };

  const handleBargain = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info(`Bargain initiated for "${title}". Seller will be notified.`);
  };

  const handleCardClick = () => {
    navigate(`/market/product/${$id}`); // Use $id here
  };

  const handleDeveloperDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeveloperDelete) {
      onDeveloperDelete($id); // Use $id here
      toast.success(`Product "${title}" (ID: ${$id}) deleted by developer.`);
    }
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border overflow-hidden cursor-pointer hover:shadow-xl transition-shadow" onClick={handleCardClick}>
      <img src={imageUrl} alt={title} className="w-full h-32 object-cover" />
      <CardContent className="p-3">
        <h3 className="text-lg font-semibold text-foreground truncate">{title}</h3>
        <p className="text-xl font-bold text-secondary-neon mt-1">{price}</p>
        <div className="flex items-center text-sm text-muted-foreground mt-2">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
          <span>{sellerRating.toFixed(1)} Seller Rating</span>
          {sellerBadge && (
            <Badge variant="secondary" className="ml-2 bg-primary-blue-light text-primary-foreground">
              {sellerBadge}
            </Badge>
          )}
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleBuyRent}
          >
            {type === "rent" ? "Rent Now" : (type === "gift-request" ? "Accept Request" : "Buy Now")}
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10"
            onClick={handleBargain}
          >
            Bargain
          </Button>
        </div>
        {isDeveloper && onDeveloperDelete && (
          <Button
            variant="destructive"
            size="sm"
            className="w-full mt-3 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={handleDeveloperDeleteClick}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Developer Delete
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductListingCard;