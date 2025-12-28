import React from 'react';
import { Product } from '@/hooks/useMarketListings';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-lg">{product.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{product.category}</p>
      </CardHeader>
      <CardContent>
        {product.imageUrl && (
          <img src={product.imageUrl} alt={product.title} className="w-full h-32 object-cover rounded-md mb-2" />
        )}
        <p className="text-sm text-gray-700 line-clamp-2 mb-2">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="flex items-center text-lg font-semibold text-primary">
            <DollarSign className="h-4 w-4 mr-1" /> {product.price.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground flex items-center">
            <Tag className="h-3 w-3 mr-1" /> {product.condition}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Link to={`/market/${product.$id}`} className="w-full">
          <Button className="w-full">View Details</Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;