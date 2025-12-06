import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductListingCard from "@/components/ProductListingCard";
import { Product } from "@/lib/mockData"; // Import Product interface
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketListings } from '@/hooks/useMarketListings'; // Fixed: Import the new hook

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
  const { products, isLoading, error } = useMarketListings(); // Use the hook

  const items = filterProducts(products, activeTab);

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
    
    if (error) {
        return <p className="p-4 text-center text-destructive">Error loading listings: {error}</p>;
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
      {/* Updated TabsList for mobile responsiveness */}
      <TabsList className="flex w-full overflow-x-auto whitespace-nowrap bg-primary-blue-light text-primary-foreground h-auto p-1">
        <TabsTrigger value="all" className="flex-shrink-0 min-w-[120px] text-xs sm:text-sm data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">All</TabsTrigger>
        <TabsTrigger value="sell" className="flex-shrink-0 min-w-[120px] text-xs sm:text-sm data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Sell</TabsTrigger>
        <TabsTrigger value="rent" className="flex-shrink-0 min-w-[120px] text-xs sm:text-sm data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Rent</TabsTrigger>
        <TabsTrigger value="gift" className="flex-shrink-0 min-w-[120px] text-xs sm:text-sm data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Handcrafts & Gifts</TabsTrigger>
        <TabsTrigger value="sports" className="flex-shrink-0 min-w-[120px] text-xs sm:text-sm data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Sports</TabsTrigger>
      </TabsList>
      
      <TabsContent value={activeTab}>
        {renderContent()}
      </TabsContent>
    </Tabs>
  );
};

export default MarketTabs;