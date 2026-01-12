"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductListingCard from "@/components/ProductListingCard";
import { Product } from "@/lib/mockData";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from '@/lib/utils';
import { ShoppingBag, Tag, Clock, Gift, Dumbbell, Box, SearchX } from "lucide-react";

// Helper function to filter products by type AND search query
const filterProducts = (products: Product[], type: Product['type'] | 'all', query: string): Product[] => {
  let filtered = products;

  // 1. Filter by Type
  if (type !== 'all') {
    if (type === 'gift') {
      // Include both 'gift' and 'gift-request'
      filtered = products.filter(p => p.type === 'gift' || p.type === 'gift-request');
    } else {
      filtered = products.filter(p => p.type === type);
    }
  }

  // 2. Filter by Search Query
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }

  return filtered;
};

interface MarketTabsProps {
  initialTab?: Product['type'] | 'all';
  products: Product[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
}

const MarketTabs: React.FC<MarketTabsProps> = ({ 
    initialTab = 'all',
    products,
    isLoading,
    error,
    searchQuery
}) => {
  const [activeTab, setActiveTab] = useState<Product['type'] | 'all'>(initialTab);

  const items = filterProducts(products, activeTab, searchQuery);

  const tabConfig = [
    { value: "all", label: "All Items", icon: ShoppingBag },
    { value: "sell", label: "For Sale", icon: Tag },
    { value: "rent", label: "Rentals", icon: Clock },
    { value: "gift", label: "Gifts & Crafts", icon: Gift },
    { value: "sports", label: "Sports Gear", icon: Dumbbell },
  ];

  const renderContent = () => {
    // LOADING
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3 bg-card border border-border/40 rounded-xl p-3 h-full">
               <Skeleton className="h-32 w-full rounded-lg bg-muted/50" />
               <div className="space-y-2 px-1">
                 <Skeleton className="h-4 w-3/4 rounded bg-muted/60" />
                 <Skeleton className="h-3 w-full rounded bg-muted/40" />
                 <Skeleton className="h-3 w-1/2 rounded bg-muted/40" />
               </div>
               <div className="mt-auto pt-2 flex justify-between items-center px-1">
                  <Skeleton className="h-4 w-16 rounded bg-muted/50" />
                  <Skeleton className="h-8 w-20 rounded bg-muted/50" />
               </div>
            </div>
          ))}
        </div>
      );
    }
    
    // ERROR
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-destructive bg-destructive/5 rounded-xl border border-destructive/20">
                <SearchX className="h-10 w-10 mb-2" />
                <p>Error loading listings: {error}</p>
            </div>
        );
    }

    // EMPTY (No Listings)
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted/30 p-6 rounded-full mb-4">
                <Box className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
                {searchQuery ? `No results for "${searchQuery}"` : "No listings found"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mt-1">
                {searchQuery ? "Try checking your spelling or use different keywords." : "This category is currently empty. Be the first to list something!"}
            </p>
        </div>
      );
    }

    // LISTINGS GRID
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 py-2 animate-in fade-in zoom-in-95 duration-300">
        {items.map((product) => (
          <ProductListingCard key={product.$id} product={product} />
        ))}
      </div>
    );
  };

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Product['type'] | 'all')} className="w-full space-y-6">
      <TabsList className="flex w-full justify-start overflow-x-auto bg-transparent p-0 gap-2 scrollbar-hide">
        {tabConfig.map((tab) => (
            <TabsTrigger 
                key={tab.value} 
                value={tab.value} 
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-border bg-card data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground data-[state=active]:border-secondary-neon data-[state=active]:shadow-md transition-all duration-300 min-w-max hover:bg-muted"
            >
                <tab.icon className="h-4 w-4" />
                <span className="text-xs font-bold">{tab.label}</span>
            </TabsTrigger>
        ))}
      </TabsList>
      
      <TabsContent value={activeTab} className="mt-0 min-h-[300px]">
        {renderContent()}
      </TabsContent>
    </Tabs>
  );
};

export default MarketTabs;