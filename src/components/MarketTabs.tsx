import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMarketListings, ProductCategory } from '@/hooks/useMarketListings'; // Import Product from useMarketListings
import ProductCard from './ProductCard'; // Assuming ProductCard exists and uses this Product type
import { Loader2, AlertTriangle, Laptop, Book, Shirt, Package, MoreHorizontal } from 'lucide-react';

const categoryIcons = {
  All: Package,
  Electronics: Laptop,
  Books: Book,
  Apparel: Shirt,
  Services: MoreHorizontal, // Services might be a separate section, but included for completeness
  Other: MoreHorizontal,
};

const MarketTabs: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "All">("All");
  const { products, isLoading, error } = useMarketListings();

  const filteredProducts = activeCategory === "All"
    ? products
    : products.filter(product => product.category === activeCategory);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Marketplace Categories</CardTitle>
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
          <CardTitle>Marketplace Categories</CardTitle>
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
        <CardTitle>Marketplace Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as ProductCategory | "All")} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
            {Object.entries(categoryIcons).map(([category, Icon]) => (
              <TabsTrigger key={category} value={category}>
                <Icon className="h-4 w-4 mr-2" /> {category}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-4">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">
              {activeCategory === "All" ? "All Products" : `${activeCategory} Products`}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                  <ProductCard key={product.$id} product={product} />
                ))
              ) : (
                <p className="col-span-full text-center text-muted-foreground">No products found in this category.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MarketTabs;