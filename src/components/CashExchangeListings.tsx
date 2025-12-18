"use client";

import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CASH_EXCHANGE_COLLECTION_ID } from "@/lib/appwrite";
import { Models } from "appwrite";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface CashExchangeListing extends Models.Document {
  requesterId: string;
  requesterName: string;
  collegeName: string;
  amount: number;
  type: "need-cash" | "have-cash";
  exchangeRate?: string; // e.g., "1:1" or "1:1.01" for a small fee
  contact: string;
  status: "open" | "matched" | "completed" | "cancelled";
  matchedWith?: string; // userId of the person matched with
}

interface CashExchangeListingsProps {
  listings: CashExchangeListing[];
  onMatch: (listingId: string, matchedWithUserId: string) => void;
}

const CashExchangeListings: React.FC<CashExchangeListingsProps> = ({ listings, onMatch }) => {
  const { user, userProfile } = useAuth();

  const handleMatchClick = async (listing: CashExchangeListing) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to match an exchange.");
      return;
    }
    if (user.$id === listing.requesterId) {
      toast.error("You cannot match your own listing.");
      return;
    }

    if (!window.confirm(`Are you sure you want to match this request? You will be connected with ${listing.requesterName}.`)) {
      return;
    }

    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CASH_EXCHANGE_COLLECTION_ID,
        listing.$id,
        {
          status: "matched",
          matchedWith: user.$id,
        }
      );
      toast.success(`You have matched with ${listing.requesterName}! Contact them at ${listing.contact}.`);
      onMatch(listing.$id, user.$id);
    } catch (error: any) {
      console.error("Error matching exchange:", error);
      toast.error(error.message || "Failed to match exchange.");
    }
  };

  const getStatusBadgeClass = (status: CashExchangeListing["status"]) => {
    switch (status) {
      case "open":
        return "bg-green-500 text-white";
      case "matched":
        return "bg-blue-500 text-white";
      case "completed":
        return "bg-gray-500 text-white";
      case "cancelled":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {listings.map((listing) => (
        <Card key={listing.$id} className="bg-card text-card-foreground shadow-md border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-lg font-semibold text-card-foreground">
              {listing.type === "need-cash" ? "Need Cash" : "Have Cash"}
            </CardTitle>
            <p className="text-2xl font-bold text-secondary-neon">₹{listing.amount.toFixed(2)}</p>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-1">
            <p className="text-sm text-muted-foreground">Requester: {listing.requesterName}</p>
            <p className="text-xs text-muted-foreground">Contact: {listing.contact}</p>
            {listing.exchangeRate && (
              <p className="text-xs text-muted-foreground">Exchange Rate: {listing.exchangeRate}</p>
            )}
            <div className="flex items-center justify-between mt-2">
              <Badge className={cn("px-2 py-1 text-xs font-semibold", getStatusBadgeClass(listing.status))}>
                {listing.status}
              </Badge>
              {listing.status === "open" && user?.$id !== listing.requesterId && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleMatchClick(listing)}
                  className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
                >
                  Match
                </Button>
              )}
              {listing.status === "matched" && listing.matchedWith === user?.$id && (
                <Button variant="outline" size="sm" disabled>
                  Matched by You
                </Button>
              )}
              {listing.status === "matched" && listing.requesterId === user?.$id && (
                <Button variant="outline" size="sm" disabled>
                  Matched
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CashExchangeListings;