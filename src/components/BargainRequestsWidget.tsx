"use client";

import React, { useState } from "react"; // Add useState import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquareText, Loader2, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { Badge }2 } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useBargainRequests } from "@/hooks/useBargainRequests";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const BargainRequestsWidget: React.FC = () => {
  const { user } = useAuth();
  const { sellerRequests, isLoading, error, updateBargainStatus } = useBargainRequests();
  const [isUpdating, setIsUpdating] = useState(false); // Now useState is properly imported

  const handleUpdateStatus = async (requestId: string, newStatus: "accepted" | "denied") => {
    setIsUpdating(true);
    try {
      await updateBargainStatus(requestId, newStatus);
      toast.success(`Bargain request ${newStatus} successfully!`);
    } catch (e) {
      // Error handled in hook
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return null; // Don't render if user is not logged in
  }

  if (isLoading) {
    return (
      <Card className="bg-card text-card-foreground shadow-lg border-border p-6 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
        <p className="ml-3 text-muted-foreground">Loading bargain requests...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card text-card-foreground shadow-lg border-border p-6">
        <p className="text-destructive">Error loading bargain requests: {error}</p>
      </Card>
    );
  }

  if (sellerRequests.length === 0) {
    return (
      <Card className="bg-card text-card-foreground shadow-lg border-border">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
            <MessageSquareText className="h-5 w-5 text-secondary-neon" /> Bargain Requests
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-center text-muted-foreground py-4">No pending bargain requests.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <MessageSquareText className="h-5 w-5 text-secondary-neon" /> Bargain Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {sellerRequests.map((request) => (
          <div key={request.$id} className="p-3 border border-border rounded-md bg-background">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">{request.productTitle}</h3>
              <Badge className={cn(
                "px-2 py-1 text-xs font-semibold",
                request.status === "pending" && "bg-yellow-500 text-white",
                request.status === "accepted" && "bg-green-500 text-white",
                request.status === "denied" && "bg-destructive text-destructive-foreground"
              )}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">From: <span className="font-medium text-foreground">{request.buyerName}</span></p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-4 w-4" /> Requested Price: <span className="font-bold text-secondary-neon">₹{parseFloat(request.requestedPrice).toFixed(2)}</span>
            </p>
            <p className="text-xs text-muted-foreground">Original Price: {request.originalPrice}</p>
            <p className="text-xs text-muted-foreground">Posted: {new Date(request.$createdAt).toLocaleDateString()}</p>

            {request.status === "pending" && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="flex-1 bg-green-500 text-white hover:bg-green-600"
                  onClick={() => handleUpdateStatus(request.$id, "accepted")}
                  disabled={isUpdating}
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Accept
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => handleUpdateStatus(request.$id, "denied")}
                  disabled={isUpdating}
                >
                  <XCircle className="mr-2 h-4 w-4" /> Deny
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default BargainRequestsWidget;