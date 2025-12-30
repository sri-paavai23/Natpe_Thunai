"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useBargainRequests } from '@/hooks/useBargainRequests';
import { toast } from 'sonner';

const BargainRequestsWidget: React.FC = () => {
  const { currentUser } = useAuth();
  const { sellerRequests, isLoading, error, updateBargainStatus, refetch } = useBargainRequests();

  const handleUpdateStatus = async (requestId: string, status: 'accepted' | 'rejected' | 'cancelled') => {
    await updateBargainStatus(requestId, status);
    refetch();
  };

  if (!currentUser) {
    return null; // Or a message indicating user needs to log in
  }

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader>
        <CardTitle>Bargain Requests</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading requests...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : sellerRequests.length === 0 ? (
          <p className="text-muted-foreground">No new bargain requests.</p>
        ) : (
          <div className="space-y-4">
            {sellerRequests.map((request) => (
              <div key={request.$id} className="border p-3 rounded-md">
                <p className="font-semibold">{request.productTitle}</p>
                <p className="text-sm text-muted-foreground">From: {request.buyerName}</p>
                <p className="text-lg font-bold">Proposed: ₹{request.proposedPrice}</p>
                <p className={`text-sm font-medium ${request.status === 'pending' ? 'text-orange-500' : request.status === 'accepted' ? 'text-green-500' : 'text-red-500'}`}>
                  Status: {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </p>
                {request.status === 'pending' && (
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => handleUpdateStatus(request.$id, 'accepted')}>Accept</Button>
                    <Button variant="outline" size="sm" onClick={() => handleUpdateStatus(request.$id, 'rejected')}>Reject</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BargainRequestsWidget;