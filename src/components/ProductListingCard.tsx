import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/mockData"; // Import Product interface
import { Trash2 } from 'lucide-react';

interface ProductListingCardProps {
  product: Product;
  onDeveloperDelete?: (productId: string) => void;
}

const ProductListingCard: React.FC<ProductListingCardProps> = ({ product, onDeveloperDelete }) => {
  const isDeveloper = product.isDeveloper && onDeveloperDelete;

  return (
    <Card className="flex flex-col h-full relative">
      {isDeveloper && (
        <Button 
          variant="destructive" 
          size="icon" 
          className="absolute top-2 right-2 z-10 h-8 w-8"
          onClick={() => onDeveloperDelete(product.$id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
      <CardHeader>
        <CardTitle>{product.title}</CardTitle>
        <CardDescription>{product.price}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-gray-600">{product.description}</p>
        <div className="mt-2 text-xs text-gray-500">
          Seller: {product.sellerName} ({product.sellerRating} stars)
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View Details</Button>
      </CardFooter>
    </Card>
  );
};

export default ProductListingCard;