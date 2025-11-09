"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const initialListings = [
  { id: "1", title: "Vintage Camera", price: "₹5000", imageUrl: "/app-logo.png", category: "Electronics" },
  { id: "2", title: "Textbook: Advanced Physics", price: "₹800", imageUrl: "/app-logo.png", category: "Books" },
  { id: "3", title: "Custom Art Commission", price: "₹1500", imageUrl: "/app-logo.png", category: "Services" },
  { id: "4", title: "Gaming Headset", price: "₹2500", imageUrl: "/app-logo.png", category: "Electronics" },
];

const moreListings = [
  { id: "5", title: "Graphic Design Service", price: "₹1000", imageUrl: "/app-logo.png", category: "Services" },
  { id: "6", title: "Used Bicycle", price: "₹3000", imageUrl: "/app-logo.png", category: "Sports" },
  { id: "7", title: "Handmade Earrings", price: "₹350", imageUrl: "/app-logo.png", category: "Crafts" },
  { id: "8", title: "Old Novels Set", price: "₹600", imageUrl: "/app-logo.png", category: "Books" },
  { id: "9", title: "Web Development Help", price: "₹2000", imageUrl: "/app-logo.png", category: "Services" },
  { id: "10", title: "Basketball", price: "₹800", imageUrl: "/app-logo.png", category: "Sports" },
];

const DiscoveryFeed = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState(initialListings);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const handleViewDetails = (listingId: string) => {
    toast.info(`Viewing details for listing ${listingId}`);
    // In a real app, navigate to /market/listing/${listingId}
  };

  const handleViewAllFeed = () => {
    navigate("/market");
    toast.info("Navigating to the full Discovery Feed!");
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setListings((prevListings) => [...prevListings, ...moreListings]);
      setHasMore(false); // For this demo, we'll only load one more batch
      setLoadingMore(false);
      toast.success("More listings loaded!");
    }, 1000);
  };

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground cursor-pointer hover:text-secondary-neon transition-colors" onClick={handleViewAllFeed}>
          Discovery Feed
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground mb-3">New, trending, top-rated listings.</p>
        <ScrollArea className="w-full whitespace-nowrap rounded-md border border-border p-2">
          <div className="flex w-max space-x-4 pb-2">
            {listings.map((listing) => (
              <div key={listing.id} className="w-[150px] flex-shrink-0">
                <Card className="bg-background border-border hover:shadow-md transition-shadow duration-200">
                  <img
                    src={listing.imageUrl}
                    alt={listing.title}
                    className="aspect-square w-full rounded-t-md object-cover"
                  />
                  <div className="p-3">
                    <h4 className="font-semibold text-foreground text-sm truncate">{listing.title}</h4>
                    <p className="text-xs text-muted-foreground">{listing.price}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-2 text-secondary-neon hover:bg-secondary-neon/10"
                      onClick={() => handleViewDetails(listing.id)}
                    >
                      View <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              </div>
            ))}
            {hasMore && (
              <div className="w-[150px] flex-shrink-0 flex items-center justify-center">
                <Button
                  variant="outline"
                  className="border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Load More
                </Button>
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DiscoveryFeed;