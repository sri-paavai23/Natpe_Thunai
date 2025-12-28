import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useBargainRequests, BargainRequest } from '@/hooks/useBargainRequests';
import { toast } from 'sonner';
import { DollarSign, CheckCircle2, XCircle, Clock } from 'lucide-react';

const BargainRequestsWidget = () => {
  const { user } = useAuth();
  const { sellerRequests, isLoading, error, refetch, updateBargainStatus } = useBargainRequests(); // Use updateBargainStatus
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAccept = async (requestId: string) => {
    setIsUpdating(true);
    try {
      await updateBargainStatus(requestId, "accepted");
      refetch();
    } catch (err) {
      console.error("Failed to accept bargain:", err);
      toast.error("Failed to accept bargain.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async (requestId: string) => {
    setIsUpdating(true);
    try {
      await updateBargainStatus(requestId, "rejected");
      refetch();
    } catch (err) {
      console.error("Failed to reject bargain:", err);
      toast.error("Failed to reject bargain.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return null; // Only show if logged in
  }

  const pendingRequests = sellerRequests.filter(req => req.status === "initiated");

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Bargain Requests</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading requests...</div>
        ) : error ? (
          <div className="text-center text-red-500">Error: {error}</div>
        ) : pendingRequests.length === 0 ? (
          <p className="text-center text-muted-foreground">No pending bargain requests.</p>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map(request => (
              <div key={request.$id} className="border p-3 rounded-md">
                <p className="text-sm font-medium">{request.buyerName} wants to buy "{request.productTitle}"</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3 w-3" /> Proposed: ₹{request.requestedPrice.toFixed(2)}
                </p>
                {request.message && (
                  <p className="text-xs text-muted-foreground mt-1">Message: {request.message}</p>
                )}
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" /> Posted: {new Date(request.$createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => handleAccept(request.$id)} disabled={isUpdating}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Accept
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleReject(request.$id)} disabled={isUpdating}>
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BargainRequestsWidget;