"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Phone, DollarSign, MapPin, MessageSquareText } from "lucide-react";
import { ServicePost } from "@/hooks/useServiceListings";
import { generateAvatarUrl } from "@/utils/avatarGenerator";

interface FoodCustomRequestsListProps {
  requests: ServicePost[];
  isLoading: boolean;
  error: string | null;
}

const FoodCustomRequestsList: React.FC<FoodCustomRequestsListProps> = ({ requests, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <p className="ml-3 text-muted-foreground">Loading custom requests...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-destructive py-4">Error loading requests: {error}</p>;
  }

  if (requests.length === 0) {
    return <p className="text-center text-muted-foreground py-4">No custom food or wellness requests posted yet.</p>;
  }

  return (
    <div className="space-y-4">
      {requests.map((post) => {
        const avatarUrl = generateAvatarUrl(post.posterName || "Anonymous", post.posterAvatarStyle || "pixel-art", 128);
        return (
          <Card key={post.$id} className="bg-background text-foreground border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-3">
                <Avatar className="h-9 w-9 border-2 border-secondary-neon">
                  <AvatarImage src={avatarUrl} alt={post.posterName} />
                  <AvatarFallback>
                    <User className="h-5 w-5 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg font-semibold">{post.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Requested by {post.posterName}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{post.collegeName}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-sm text-muted-foreground mt-1">{post.description}</p>
              {post.isCustomOrder && post.customOrderDescription && (
                <p className="text-xs text-muted-foreground mt-1">Details: <span className="font-medium text-foreground">{post.customOrderDescription}</span></p>
              )}
              <div className="flex items-center gap-2 text-primary-foreground">
                <DollarSign className="h-4 w-4 text-secondary-neon" />
                <span className="font-medium">Budget: {post.price}</span>
              </div>
              {post.ambassadorDelivery && (
                <div className="flex items-center gap-2 text-primary-foreground">
                  <MessageSquareText className="h-4 w-4 text-secondary-neon" />
                  <span className="font-medium">Ambassador Delivery: {post.ambassadorMessage || "Requested"}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Posted by: {post.posterName}</p>
              <p className="text-xs text-muted-foreground">Posted: {new Date(post.$createdAt).toLocaleDateString()}</p>
            </CardContent>
            <CardFooter className="pt-2">
              <Button asChild className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                <a href={`tel:${post.contact}`} target="_blank" rel="noopener noreferrer">
                  <Phone className="mr-2 h-4 w-4" /> Contact Requester
                </a>
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default FoodCustomRequestsList;