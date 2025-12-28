import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductListingCard from "@/components/ProductListingCard";
import { Product } from "@/lib/mockData"; // Import Product interface
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketListings } from '@/hooks/useMarketListings'; // Import the new hook
import { cn } from '@/lib/utils'; // Import cn for utility classes

// Helper function to filter products by type
const filterProducts = (products: Product[], type: Product['type'] | 'all'): Product[] => {
  if (type === 'all') return products;
  // Handle both 'gift' and 'gift-request' under the 'gift' tab for now, 
  // but the tab value remains 'gift' for filtering simplicity.
  if (type === 'gift') {
    return products.filter(p => p.type === 'gift' || p.type === 'gift-request');
  }
  return products.filter(p => p.type === type);
};

interface MarketTabsProps {
  initialTab?: Product['type'] | 'all';
}

const MarketTabs: React.FC<MarketTabsProps> = ({ initialTab = 'all' }) => {
  const [activeTab, setActiveTab] = useState<Product['type'] | 'all'>(initialTab);
  const { products, isLoading, error } = useMarketListings(); // useMarketListings already filters by collegeName internally

  const items = filterProducts(products, activeTab);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      );
    }
    
    if (error) {
        return <p className="p-4 text-center text-destructive">Error loading listings: {error}</p>;
    }

    if (items.length === 0) {
      return <p className="p-4 text-center text-gray-500">No listings found for this category in your college.</p>;
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
        {items.map((product) => (
          <ProductListingCard key={product.$id} product={product} />
        ))}
      </div>
    );
  };

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Product['type'] | 'all')} className="w-full">
      <TabsList className="flex w-full overflow-x-auto whitespace-nowrap bg-muted p-1 text-muted-foreground rounded-md shadow-sm scrollbar-hide">
        <TabsTrigger value="all" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">All</TabsTrigger>
        <TabsTrigger value="sell" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Sell</TabsTrigger>
        <TabsTrigger value="rent" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Rent</TabsTrigger>
        <TabsTrigger value="gift" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Handcrafts & Gifts</TabsTrigger>
        <TabsTrigger value="sports" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Sports</TabsTrigger>
      </TabsList>
      
      <TabsContent value={activeTab}>
        {renderContent()}
      </TabsContent>
    </Tabs>
  );
};

export default MarketTabs;