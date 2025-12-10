"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Utensils, Heart } from "lucide-react";
import { FoodRequest } from "@/hooks/useFoodOfferings"; // Import FoodRequest type

interface FoodCustomRequestsListProps {
  requests: FoodRequest[];
  isLoading: boolean;
  error: string | null;
}

const FoodCustomRequestsList: React.FC<FoodCustomRequestsListProps> = ({ requests, isLoading, error }) => {
  return (
    <Card className="bg-card text-card-foreground shadow-lg border-border">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
          <Utensils className="h-5 w-5 text-secondary-neon" /> Custom Order Requests
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
            <p className="ml-3 text-muted-foreground">Loading requests...</p>
          </div>
        ) : error ? (
          <p className="text-center text-destructive py-4">Error loading requests: {error}</p>
        ) : requests.length > 0 ? (
          requests.map((request) => (
            <div key={request.$id} className="p-3 border border-border rounded-md bg-background">
              <h3 className="font-semibold text-foreground">{request.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
              <p className="text-xs text-muted-foreground mt-1">Category: <span className="font-medium text-foreground">{request.category}</span></p>
              <p className="text-xs text-muted-foreground">Contact: <span className="font-medium text-foreground">{request.contact}</span></p>
              <p className="text-xs text-muted-foreground">Requested by: <span className="font-medium text-foreground">{request.requesterName}</span></p>
              <p className="text-xs text-muted-foreground">Status: <span className="font-medium text-foreground">{request.status}</span></p>
              <p className="text-xs text-muted-foreground">Posted: {new Date(request.$createdAt).toLocaleDateString()}</p>
            </div>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-4">No custom order requests yet for your college. Be the first!</p>
        )}
      </CardContent>
    </Card>
  );
};

export default FoodCustomRequestsList;