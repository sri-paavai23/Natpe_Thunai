import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Product, filterProducts } from '@/lib/utils'; // Ensure Product interface is imported from utils
import ProductCard from './ProductCard'; // Assuming ProductCard is correctly imported
import { useAuth } from '@/context/AuthContext';
import { useMarketListings } from '@/hooks/useMarketListings';
import { Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button"; // Ensure Button is imported

const MarketTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const { userProfile, loading: isAuthLoading } = useAuth();
  const { products, isLoading, error, refetch } = useMarketListings();

  const isDeveloper = userProfile?.role === 'developer';

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary-blue" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive text-center p-4">
        <p>Error loading listings: {error}</p>
        <Button onClick={refetch} className="mt-2">Retry</Button>
      </div>
    );
  }

  const items = filterProducts(products, activeTab);

  // Mock developer delete function if not provided
  const mockDeveloperDelete = async (productId: string) => {
    toast.info(`Developer delete action for product ${productId} (mocked).`);
    refetch();
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-background-dark border border-border-dark">
          <TabsTrigger value="all" className="text-foreground data-[state=active]:bg-primary-blue data-[state=active]:text-primary-foreground">All</TabsTrigger>
          <TabsTrigger value="sell" className="text-foreground data-[state=active]:bg-primary-blue data-[state=active]:text-primary-foreground">Sell</TabsTrigger>
          <TabsTrigger value="rent" className="text-foreground data-[state=active]:bg-primary-blue data-[state=active]:text-primary-foreground">Rent</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground">No listings found.</p>
            ) : (
              items.map((listing) => (
                <ProductCard
                  key={listing.$id}
                  product={{ ...listing, isDeveloper: isDeveloper }}
                  onDeveloperDelete={isDeveloper ? (mockDeveloperDelete) : undefined}
                />
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="sell">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterProducts(items, 'sell').length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground">No items for sale found.</p>
            ) : (
              filterProducts(items, 'sell').map((listing) => (
                <ProductCard
                  key={listing.$id}
                  product={{ ...listing, isDeveloper: isDeveloper }}
                  onDeveloperDelete={isDeveloper ? (mockDeveloperDelete) : undefined}
                />
              ))
            )}
          </div>
        </TabsContent>
        <TabsContent value="rent">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filterProducts(items, 'rent').length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground">No items for rent found.</p>
            ) : (
              filterProducts(items, 'rent').map((listing) => (
                <ProductCard
                  key={listing.$id}
                  product={{ ...listing, isDeveloper: isDeveloper }}
                  onDeveloperDelete={isDeveloper ? (mockDeveloperDelete) : undefined}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketTabs;