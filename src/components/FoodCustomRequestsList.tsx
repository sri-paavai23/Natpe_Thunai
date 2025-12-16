"use client";

import React from "react";
import { ServicePost } from "@/hooks/useServiceListings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface FoodCustomRequestsListProps {
  customRequests: ServicePost[];
}

const FoodCustomRequestsList: React.FC<FoodCustomRequestsListProps> = ({ customRequests }) => {
  return (
    <div className="space-y-4">
      {customRequests.length > 0 ? (
        customRequests.map((post) => (
          <Card key={post.$id} className="bg-card text-card-foreground shadow-md border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg font-semibold text-card-foreground">{post.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-1">
              <p className="text-sm text-muted-foreground mt-1">{post.description}</p>
              {post.isCustomOrder && post.customOrderDescription && (
                <p className="text-xs text-muted-foreground mt-1">Details: <span className="font-medium text-foreground">{post.customOrderDescription}</span></p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Category: <span className="font-medium text-foreground">{post.category}</span></p>
              <p className="text-xs text-muted-foreground">{post.isCustomOrder ? "Budget" : "Price"}: <span className="font-medium text-foreground">{post.price}</span></p>
              <p className="text-xs text-muted-foreground">Requested by: {post.providerName}</p> {/* Corrected from posterName */}
              <p className="text-xs text-muted-foreground">Contact: {post.contact}</p>
              <p className="text-xs text-muted-foreground">Posted: {new Date(post.$createdAt).toLocaleDateString()}</p>
              <Button
                variant="outline"
                className="mt-2 border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10"
                onClick={() => toast.info(`Contacting ${post.providerName} at ${post.contact} to fulfill this request.`)} // Corrected from posterName
              >
                Fulfill Request
              </Button>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-center text-muted-foreground py-4">No custom food requests posted yet.</p>
      )}
    </div>
  );
};

export default FoodCustomRequestsList;