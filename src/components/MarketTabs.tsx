import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductListingCard from "@/components/ProductListingCard";
import { dummyProducts, Product } from "@/lib/mockData"; // Import Product interface and dummy data
import { Skeleton } from "@/components/ui/skeleton";

// Helper function to filter products by type
const filterProducts = (products: Product[], type: Product['type'] | 'all'): Product[] => {
  if (type === 'all') return products;
  return products.filter(p => p.type === type);
};

interface MarketTabsProps {
  initialTab?: Product['type'] | 'all';
}

const MarketTabs: React.FC<MarketTabsProps> = ({ initialTab = 'all' }) => {
  const [activeTab, setActiveTab] = useState<Product['type'] | 'all'>(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Simulate data fetching
    setTimeout(() => {
      setAllProducts(dummyProducts);
      setIsLoading(false);
    }, 500);
  }, []);

  const items = filterProducts(allProducts, activeTab);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      return <p className="p-4 text-center text-gray-500">No listings found for this category.</p>;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {items.map((product) => (
          <ProductListingCard key={product.$id} product={product} />
        ))}
      </div>
    );
  };

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Product['type'] | 'all')} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="sell">Sell</TabsTrigger>
        <TabsTrigger value="rent">Rent</TabsTrigger>
        <TabsTrigger value="gift">Gift</TabsTrigger>
        <TabsTrigger value="sports">Sports</TabsTrigger>
      </TabsList>
      
      <TabsContent value={activeTab}>
        {renderContent()}
      </TabsContent>
    </Tabs>
  );
};

export default MarketTabs;