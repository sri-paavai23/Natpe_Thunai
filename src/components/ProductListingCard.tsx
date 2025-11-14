import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/mockData"; // Import Product interface
import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom'; // Import Link

interface ProductListingCardProps {
  product: Product;
  onDeveloperDelete?: (productId: string) => void;
}

const ProductListingCard: React.FC<ProductListingCardProps> = ({ product, onDeveloperDelete }) => {
  const isDeveloper = product.isDeveloper && onDeveloperDelete;

  return (
    <Card className="flex flex-col h-full relative hover:shadow-xl transition-shadow">
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
      <Link to={`/market/product/${product.$id}`} className="flex flex-col h-full">
        <CardHeader>
          <CardTitle>{product.title}</CardTitle>
          <CardDescription>{product.price}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <img 
            src={product.imageUrl || "/app-logo.png"} 
            alt={product.title} 
            className="w-full h-32 object-cover rounded-md mb-2"
          />
          <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
          <div className="mt-2 text-xs text-gray-500">
            Seller: {product.sellerName} ({product.sellerRating} stars)
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full">View Details</Button>
        </CardFooter>
      </Link>
    </Card>
  );
};

export default ProductListingCard;