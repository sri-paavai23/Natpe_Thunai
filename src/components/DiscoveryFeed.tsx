import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import { Product } from "@/lib/mockData"; // Import Product interface
import ProductListingCard from "@/components/ProductListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useMarketListings } from '@/hooks/useMarketListings'; // Import the new hook

// Mock function for developer deletion (kept for developer role functionality)
const mockDeveloperDelete = (productId: string) => {
  console.log(`Developer deleting product: ${productId}`);
  // In a real app, this would call an API endpoint or Appwrite function
};

const DiscoveryFeed: React.FC = () => {
  const { userProfile } = useAuth();
  const { products: listings, isLoading, error } = useMarketListings(); // Use the hook

  // Determine developer status
  const isDeveloper = userProfile?.role === "developer";

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Feed</AlertTitle>
          <AlertDescription>
            Failed to load listings from the database: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="p-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Listings Found</AlertTitle>
          <AlertDescription>
            It looks like there are no products available right now.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {listings.map((listing) => (
        <ProductListingCard
          key={listing.$id}
          product={{ ...listing, isDeveloper: isDeveloper }} // Inject developer status for card actions
          onDeveloperDelete={isDeveloper ? mockDeveloperDelete : undefined}
        />
      ))}
    </div>
  );
};

export default DiscoveryFeed;