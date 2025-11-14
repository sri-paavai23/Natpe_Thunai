import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ID, Query } from 'appwrite';
import { dummyProducts, Product } from "@/lib/mockData"; // Import dummy products and Product interface
import { containsBlockedWords } from "@/lib/moderation"; // Import moderation utility
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, MapPin, Star } from 'lucide-react';

// Placeholder for moderation utility if it doesn't exist
// Note: Assuming containsBlockedWords exists or is mocked elsewhere.

export default function ProductDetailsPage() {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    // Simulate fetching product details
    const foundProduct = dummyProducts.find(p => p.$id === productId);
    
    if (foundProduct) {
      setProduct(foundProduct);
    } else {
      setError("Product not found.");
    }
    
    setIsLoading(false);
  }, [productId]);

  if (isLoading) {
    return <div className="p-6 text-center">Loading product details...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!product) return null;

  const isModerated = containsBlockedWords(product.description) || containsBlockedWords(product.title);

  return (
    <div className="container mx-auto p-6">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Section */}
        <div>
          <img 
            src={product.imageUrl || "https://via.placeholder.com/600x400?text=Product+Image"} 
            alt={product.title} 
            className="w-full h-auto object-cover rounded-lg shadow-lg"
          />
        </div>

        {/* Details Section */}
        <div>
          <h1 className="text-4xl font-bold mb-2">{product.title}</h1>
          <p className="text-3xl font-semibold text-primary mb-4">{product.price}</p>

          <div className="flex items-center space-x-2 mb-4">
            <Badge variant="secondary">{product.type.toUpperCase()}</Badge>
            <div className="flex items-center text-yellow-500">
              <Star className="h-4 w-4 mr-1 fill-yellow-500" />
              <span>{product.sellerRating}</span>
            </div>
            {product.sellerBadge && <Badge variant="default">{product.sellerBadge}</Badge>}
          </div>

          <p className="text-gray-700 mb-6">{product.description}</p>

          <div className="space-y-4">
            <Button size="lg" className="w-full">Contact Seller</Button>
            <Button variant="outline" size="lg" className="w-full">Add to Watchlist</Button>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Seller Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{product.sellerName}</p>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span>Located in {product.location}</span>
              </div>
            </CardContent>
          </Card>

          {product.damages && (
            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Condition Note</AlertTitle>
              <AlertDescription>
                {product.damages}
              </AlertDescription>
            </Alert>
          )}

          {isModerated && (
            <Alert variant="warning" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Under Review</AlertTitle>
              <AlertDescription>
                This listing may contain sensitive content and is currently under review by moderators.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}