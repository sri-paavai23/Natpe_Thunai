import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketListings } from '@/hooks/useMarketListings';
import { Loader2, AlertTriangle } from 'lucide-react';
import ProductCard from './ProductCard'; // Assuming ProductCard exists

const DiscoveryFeed: React.FC = () => {
  const { products, isLoading, error } = useMarketListings();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Discover Products</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading products...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Discover Products</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center h-48 text-red-500">
          <AlertTriangle className="h-8 w-8 mb-2" />
          <span>Error loading products: {error}</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Discover Products</CardTitle>
      </CardHeader>
      <CardContent>
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.slice(0, 8).map(product => ( // Display up to 8 products
              <ProductCard key={product.$id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No products available yet. Be the first to post!</p>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscoveryFeed;