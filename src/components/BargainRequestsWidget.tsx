"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Handshake, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useBargainRequests } from "@/hooks/useBargainRequests";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BargainRequestsWidget = () => {
  const { user, userProfile } = useAuth();
  const { bargainRequests, isLoading, error, updateBargainRequestStatus } = useBargainRequests();

  if (!userProfile || userProfile.role === "developer") {
    return null; // Not for developers
  }

  const sellerRequests = bargainRequests.filter(
    (req) => req.sellerId === user?.$id && req.status === "pending"
  );

  const buyerRequests = bargainRequests.filter(
    (req) => req.buyerId === user?.$id && (req.status === "accepted" || req.status === "rejected" || req.status === "denied")
  );

  const handleAcceptBargain = async (requestId: string) => {
    await updateBargainRequestStatus(requestId, "accepted");
  };

  const handleRejectBargain = async (requestId: string) => {
    await updateBargainRequestStatus(requestId, "rejected");
  };

  if (isLoading) {
    return (
      <Card className="bg-card text-card-foreground shadow-lg border-border">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
          <p className="ml-2 text-muted-foreground">Loading bargain requests...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card text-card-foreground shadow-lg border-border">
        <CardContent className="p-4 text-center text-destructive">
          Error loading bargain requests: {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <Handshake className="h-5 w-5 text-secondary-neon" /> Bargain Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {sellerRequests.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Requests for Your Items</h3>
            <div className="space-y-3">
              {sellerRequests.map((req) => (
                <div key={req.$id} className="p-3 border border-border rounded-md bg-background">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{req.buyerName}</span> offered{" "}
                    <span className="font-semibold text-secondary-neon">{req.bargainPrice}</span> for{" "}
                    <span className="font-semibold text-foreground">{req.serviceTitle}</span> (Original: {req.originalPrice})
                  </p>
                  {req.message && <p className="text-xs text-muted-foreground mt-1">Message: {req.message}</p>}
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => handleAcceptBargain(req.$id)} className="bg-green-500 hover:bg-green-600 text-white">
                      <CheckCircle className="h-4 w-4 mr-1" /> Accept
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleRejectBargain(req.$id)}>
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {buyerRequests.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Your Sent Requests</h3>
            <div className="space-y-3">
              {buyerRequests.map((req) => (
                <div key={req.$id} className="p-3 border border-border rounded-md bg-background">
                  <p className="text-sm text-muted-foreground">
                    Your offer of <span className="font-semibold text-secondary-neon">{req.bargainPrice}</span> for{" "}
                    <span className="font-semibold text-foreground">{req.serviceTitle}</span> was{" "}
                    <Badge className={cn("px-2 py-1 text-xs font-semibold", {
                      "bg-green-500 text-white": req.status === "accepted",
                      "bg-red-500 text-white": req.status === "rejected" || req.status === "denied",
                    })}>
                      {req.status}
                    </Badge>
                    {" "}by {req.sellerName}.
                  </p>
                  {req.status === "accepted" && (
                    <p className="text-xs text-muted-foreground mt-1">Contact {req.sellerName} at {req.sellerUpiId} to finalize.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {sellerRequests.length === 0 && buyerRequests.length === 0 && (
          <p className="text-center text-muted-foreground py-4">No active bargain requests.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default BargainRequestsWidget;