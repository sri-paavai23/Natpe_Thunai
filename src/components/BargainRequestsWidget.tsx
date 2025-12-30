import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { useBargainRequests, BargainRequest } from '@/hooks/useBargainRequests';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

const BargainRequestsWidget: React.FC = () => {
  const { user } = useAuth(); // Corrected 'currentUser' to 'user'
  const { sellerRequests, isLoading, error, updateBargainStatus, refetch } = useBargainRequests();

  if (!user) {
    return null; // Or a message indicating login is required
  }

  if (isLoading) {
    return (
      <Card className="bg-card border-border-dark text-foreground">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Bargain Requests</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-border-dark text-foreground">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Bargain Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={refetch} className="mt-2">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (sellerRequests.length === 0) {
    return (
      <Card className="bg-card border-border-dark text-foreground">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Bargain Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No pending bargain requests.</p>
        </CardContent>
      </Card>
    );
  }

  const handleUpdateStatus = async (requestId: string, status: 'accepted' | 'rejected' | 'cancelled') => {
    await updateBargainStatus(requestId, status);
  };

  const getStatusIcon = (status: BargainRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="bg-card border-border-dark text-foreground">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Bargain Requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sellerRequests.map((request) => (
          <div key={request.$id} className="flex items-center justify-between p-3 border border-border-dark rounded-md bg-background-dark">
            <div className="flex items-center space-x-2">
              {getStatusIcon(request.status)}
              <div>
                <p className="text-sm font-medium">
                  <span className="text-primary-blue-light">{request.buyerName}</span> wants to buy <span className="text-secondary-neon">{request.productTitle}</span> for ₹{request.requestedAmount}
                </p>
                <p className="text-xs text-muted-foreground">Status: <span className="capitalize">{request.status}</span></p>
              </div>
            </div>
            {request.status === 'pending' && (
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUpdateStatus(request.$id, 'accepted')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Accept
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleUpdateStatus(request.$id, 'rejected')}
                >
                  Reject
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