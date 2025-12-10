"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Frown, Smile, MapPin, Calendar, MessageSquareText, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { LostFoundItem } from "@/hooks/useLostAndFoundListings";
import { useAuth } from "@/context/AuthContext";

interface LostAndFoundItemListProps {
  items: LostFoundItem[];
  isLoading: boolean;
  error: string | null;
  updateItemStatus: (itemId: string, newStatus: "Active" | "Resolved") => Promise<void>;
}

const LostAndFoundItemList: React.FC<LostAndFoundItemListProps> = ({ items, isLoading, error, updateItemStatus }) => {
  const { user } = useAuth();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const handleMarkResolved = async (itemId: string) => {
    if (!user) {
      toast.error("You must be logged in to update item status.");
      return;
    }
    if (window.confirm("Are you sure you want to mark this item as resolved? This means it has been returned/found.")) {
      setIsUpdatingStatus(true);
      try {
        await updateItemStatus(itemId, "Resolved");
      } catch (e) {
        // Error handled in hook
      } finally {
        setIsUpdatingStatus(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
        <p className="ml-3 text-muted-foreground">Loading items...</p>
      </div>
    );
  }
  if (error) {
    return <p className="text-center text-destructive py-4">Error loading items: {error}</p>;
  }
  if (items.length === 0) {
    return <p className="text-center text-muted-foreground py-4">No items found for this category in your college.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {items.map((item) => {
        const isPoster = user?.$id === item.posterId;
        const itemDate = new Date(item.date).toLocaleDateString();

        return (
          <Card key={item.$id} className="bg-card text-card-foreground shadow-lg border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  {item.type === "lost" ? <Frown className="h-5 w-5 text-destructive" /> : <Smile className="h-5 w-5 text-secondary-neon" />}
                  {item.itemName}
                </h3>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  item.status === "Active" ? "bg-yellow-500 text-white" : "bg-green-500 text-white"
                )}>
                  {item.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
              {item.imageUrl && (
                <img src={item.imageUrl} alt={item.itemName} className="w-full h-32 object-cover rounded-md mt-2" />
              )}
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {item.type === "lost" ? "Last Seen" : "Found"}: {item.location}</p>
                <p className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Date: {itemDate}</p>
                <p className="flex items-center gap-1"><MessageSquareText className="h-3 w-3" /> Contact: {item.contact}</p>
                <p>Posted by: {isPoster ? "You" : item.posterName}</p>
              </div>
              {isPoster && item.status === "Active" && (
                <Button
                  size="sm"
                  className="w-full bg-green-500 text-white hover:bg-green-600 mt-3"
                  onClick={() => handleMarkResolved(item.$id)}
                  disabled={isUpdatingStatus}
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Mark as Resolved
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default LostAndFoundItemList;