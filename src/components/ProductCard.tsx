import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Product } from '@/lib/utils'; // Ensure Product interface is imported
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onDeveloperDelete?: (productId: string) => Promise<void>;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onDeveloperDelete }) => {
  return (
    <Card className="bg-card border-border-dark text-foreground flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{product.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{product.collegeName}</p>
      </CardHeader>
      <CardContent className="flex-1">
        {product.imageUrl && (
          <img src={product.imageUrl} alt={product.title} className="w-full h-40 object-cover rounded-md mb-3" />
        )}
        <p className="text-xl font-bold text-secondary-neon">₹{product.price}</p>
        <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        <p className="text-xs text-muted-foreground mt-2">Type: <span className="capitalize">{product.type}</span></p>
        <p className="text-xs text-muted-foreground">Status: <span className="capitalize">{product.status}</span></p>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-4">
        <Link to={`/product/${product.$id}`}>
          <Button size="sm">View Details</Button>
        </Link>
        {product.isDeveloper && onDeveloperDelete && (
          <Button variant="destructive" size="sm" onClick={() => onDeveloperDelete(product.$id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default ProductCard;