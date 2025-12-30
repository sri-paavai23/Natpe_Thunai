"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, DollarSign, Handshake, PlusCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CASH_EXCHANGE_COLLECTION_ID } from "@/lib/appwrite";
import { Models } from "appwrite";

interface Contribution {
  userId: string;
  amount: number;
}

interface CashExchangeRequest extends Models.Document {
  type: "request" | "offer" | "group-contribution";
  amount: number;
  commission: number;
  notes: string;
  status: "Open" | "Accepted" | "Completed" | "Group Contribution";
  meetingLocation: string;
  meetingTime: string;
  contributions?: Contribution[];
  posterId: string;
  posterName: string;
  collegeName: string;
}

interface CashExchangeListingsProps {
  listings: CashExchangeRequest[];
  isLoading: boolean;
  type: "request" | "offer" | "group-contribution";
  // Add refetch if needed for parent to trigger a refresh after actions
}

// Helper functions for serialization/deserialization (copied from CashExchangePage)
const serializeContributions = (contributions: Contribution[]): string[] => {
  return contributions.map(c => JSON.stringify(c));
};

const deserializeContributions = (contributions: string[] | undefined): Contribution[] => {
  if (!contributions || !Array.isArray(contributions)) return [];
  return contributions.map(c => {
    try {
      return JSON.parse(c);
    } catch (e) {
      console.error("Failed to parse contribution item:", c, e);
      return { userId: "unknown", amount: 0 };
    }
  });
};


const CashExchangeListings: React.FC<CashExchangeListingsProps> = ({ listings, isLoading, type }) => {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleAcceptDeal = async (request: CashExchangeRequest) => {
    if (request.posterId === user?.$id) {
      toast.error("You cannot accept your own deal.");
      return;
    }
    if (request.status !== "Open") {
      toast.error("This deal is no longer open.");
      return;
    }

    setIsUpdating(true);
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CASH_EXCHANGE_COLLECTION_ID,
        request.$id,
        { status: "Accepted" }
      );
      toast.success(`Deal accepted for ${request.type} of ₹${request.amount}! Please arrange meeting.`);
    } catch (error: any) {
      console.error("Error accepting deal:", error);
      toast.error(error.message || "Failed to accept deal.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleContribute = async (request: CashExchangeRequest) => {
    if (request.posterId === user?.$id) {
      toast.error("You cannot contribute to your own request.");
      return;
    }
    if (request.status !== "Group Contribution") {
      toast.error("This is not an active group contribution request.");
      return;
    }
    if (!user) return;

    const contributionAmount = 500; // Example fixed contribution amount
    const currentContributions = request.contributions || []; // Deserialize here
    const currentContributionTotal = currentContributions.reduce((sum, c) => sum + c.amount, 0) || 0;
    const remainingAmount = request.amount - currentContributionTotal;

    if (remainingAmount <= 0) {
      toast.error("This group contribution is already fully funded.");
      return;
    }
    
    const actualContribution = Math.min(contributionAmount, remainingAmount);
    
    // Check if user already contributed (optional, but good practice)
    if (currentContributions.some(c => c.userId === user.$id)) {
        toast.warning("You have already contributed to this request.");
        // For simplicity, we allow multiple contributions until fully funded, but warn.
    }

    const newContributions: Contribution[] = [
      ...currentContributions,
      { userId: user.$id, amount: actualContribution }
    ];

    setIsUpdating(true);
    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CASH_EXCHANGE_COLLECTION_ID,
        request.$id,
        { contributions: serializeContributions(newContributions) } // Serialize back before updating
      );
      toast.success(`You contributed ₹${actualContribution} to this request!`);
    } catch (error: any) {
      console.error("Error contributing:", error);
      toast.error(error.message || "Failed to record contribution.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
        <p className="ml-3 text-muted-foreground">Loading listings...</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return <p className="text-center text-muted-foreground py-4">No {type.replace('-', ' ')} posts yet for your college.</p>;
  }

  return (
    <div className="space-y-4">
      {listings.map((req) => {
        const isPoster = req.posterId === user?.$id;
        const currentContributions = req.contributions || [];
        const currentContributionTotal = currentContributions.reduce((sum, c) => sum + c.amount, 0) || 0;
        const remainingAmount = req.amount - currentContributionTotal;

        return (
          <div key={req.$id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border border-border rounded-md bg-background">
            <div>
              <p className="font-semibold text-foreground">
                ₹{req.amount} 
                <Badge className={cn("ml-2", 
                  req.type === "request" && "bg-blue-500 text-white",
                  req.type === "offer" && "bg-green-500 text-white",
                  req.type === "group-contribution" && "bg-purple-500 text-white"
                )}>
                  {req.type === "group-contribution" ? "Group" : req.type.charAt(0).toUpperCase() + req.type.slice(1)}
                </Badge>
              </p>
              <p className="text-sm text-muted-foreground">{req.notes}</p>
              <p className="text-xs text-muted-foreground">Poster: {isPoster ? "You" : req.posterName}</p>
              {req.meetingLocation && <p className="text-xs text-muted-foreground">Meet: {req.meetingLocation} at {req.meetingTime}</p>}
              
              {req.type === "group-contribution" && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Users className="h-3 w-3" /> Contributed: ₹{currentContributionTotal} / ₹{req.amount}
                </p>
              )}
            </div>
            
            {/* Action Buttons */}
            {req.status === "Open" && !isPoster && (
              <Button size="sm" className="mt-2 sm:mt-0 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" onClick={() => handleAcceptDeal(req)} disabled={isUpdating}>
                Accept Deal
              </Button>
            )}
            {req.status === "Group Contribution" && !isPoster && remainingAmount > 0 && (
              <Button size="sm" className="mt-2 sm:mt-0 bg-blue-500 text-white hover:bg-blue-600" onClick={() => handleContribute(req)} disabled={isUpdating}>
                Contribute (₹500)
              </Button>
            )}
            {req.status !== "Open" && req.status !== "Group Contribution" && (
              <Badge className={cn("mt-2 sm:mt-0", req.status === "Accepted" ? "bg-orange-500 text-white" : "bg-green-500 text-white")}>
                {req.status}
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CashExchangeListings;