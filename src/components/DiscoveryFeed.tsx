import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext"; // Import useAuth
import { dummyProducts, Product } from "@/lib/mockData"; // Import dummyProducts and Product interface
import ProductListingCard from "@/components/ProductListingCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

// Mock function for developer deletion
const mockDeveloperDelete = (productId: string) => {
  console.log(`Developer deleting product: ${productId}`);
  // In a real app, this would call an API endpoint
};

const DiscoveryFeed: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [listings, setListings] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
      // Add isDeveloper flag if the user is a developer
      const processedListings = dummyProducts.map(product => ({
        ...product,
        isDeveloper: user?.isDeveloper || false,
      }));
      setListings(processedListings);
      setIsLoading(false);
    }, 1000);
  }, [user]);

  if (isAuthLoading || isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
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
            It looks like there are no products matching your criteria right now.
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
          product={listing} // Pass the entire listing object as the 'product' prop
          onDeveloperDelete={listing.isDeveloper ? mockDeveloperDelete : undefined}
        />
      ))}
    </div>
  );
};

export default DiscoveryFeed;