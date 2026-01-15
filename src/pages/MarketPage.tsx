"use client";

import React, { useState } from "react";
import { MarketWarningBanner } from "@/components/MarketWarningBanner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import MarketTabs from "@/components/MarketTabs";
import MarketListingFormWrapper from "@/components/forms/MarketListingFormWrapper";
import { Plus, Search, Tag, ShoppingBag, RefreshCw, Zap, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useMarketListings } from "@/hooks/useMarketListings";

export default function MarketPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // 1. Lifted State: Fetch data here so we can control search & loading
  const { products, isLoading, error, refetch } = useMarketListings();

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 relative overflow-x-hidden">
      
      {/* --- HERO HEADER --- */}
      <div className="bg-gradient-to-b from-secondary/5 to-background border-b border-border/40 pb-6 pt-4 px-4 sticky top-0 z-10 backdrop-blur-md bg-background/80">
        <div className="max-w-md mx-auto space-y-4">
          
          {/* Top Row: Title & Pulse */}
          <div className="flex justify-between items-start">
            <div>
              {/* Responsive Text: Smaller on mobile, larger on tablet+ */}
              <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter text-foreground">
                THE <span className="text-secondary-neon text-transparent bg-clip-text bg-gradient-to-r from-secondary-neon to-cyan-400">EXCHANGE</span>
              </h1>
              <p className="text-xs text-muted-foreground font-medium mt-1 pr-4 leading-tight">
                Buy, Sell, Rent & Donate on campus.
              </p>
            </div>
            
            {/* Live Indicator / Refresh */}
            <div className="flex items-center gap-1.5 shrink-0">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={refetch} 
                    className="h-8 w-8 text-muted-foreground hover:text-secondary-neon active:scale-90 transition-transform"
                    disabled={isLoading}
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
                <Badge variant="outline" className="animate-pulse border-secondary-neon/50 text-secondary-neon bg-secondary-neon/10 gap-1.5 py-0.5 px-2 text-[10px] sm:text-xs">
                <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-neon opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-secondary-neon"></span>
                </span>
                LIVE
                </Badge>
            </div>
          </div>

          <MarketWarningBanner />

          {/* Search Bar - Touch Optimized */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary-neon to-blue-600 rounded-lg blur opacity-15 group-hover:opacity-30 transition duration-500"></div>
            <div className="relative flex items-center">
                <Search className="absolute left-3 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Search products..." 
                  className="pl-10 h-11 sm:h-12 bg-card border-border shadow-sm text-base sm:text-lg focus:ring-2 focus:ring-secondary-neon/50 focus:border-secondary-neon transition-all rounded-lg placeholder:text-muted-foreground/70"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>

          {/* Quick Stats - Snap Scrolling for Mobile */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0">
             <div className="snap-start flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full shadow-sm min-w-max">
                <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full"><Tag className="h-3 w-3 text-green-600 dark:text-green-400" /></div>
                <span className="text-xs font-bold">Best Deals</span>
             </div>
             <div className="snap-start flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full shadow-sm min-w-max">
                <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full"><RefreshCw className="h-3 w-3 text-blue-600 dark:text-blue-400" /></div>
                <span className="text-xs font-bold">Fresh Listings</span>
             </div>
             <div className="snap-start flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full shadow-sm min-w-max">
                <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-full"><Zap className="h-3 w-3 text-purple-600 dark:text-purple-400" /></div>
                <span className="text-xs font-bold">Fast Selling</span>
             </div>
          </div>

        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="max-w-md sm:max-w-5xl mx-auto px-4 mt-4 space-y-6">
        
        {/* Pass Data & Search to Tabs */}
        <MarketTabs 
            initialTab="all" 
            products={products}
            isLoading={isLoading}
            error={error}
            searchQuery={searchQuery}
        />

      </div>

      {/* --- FAB (Floating Action Button) --- */}
      <div className="fixed bottom-20 right-4 z-50 md:bottom-8 md:right-8">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
                size="lg" 
                className="h-14 w-14 rounded-full bg-secondary-neon text-primary-foreground shadow-[0_4px_20px_rgba(0,243,255,0.4)] active:scale-95 transition-all duration-300 flex items-center justify-center p-0 border-2 border-background"
            >
              <Plus className="h-7 w-7" />
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95%] sm:max-w-[600px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto rounded-xl">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                    <ShoppingBag className="h-5 w-5 text-secondary-neon" /> Create Listing
                </DialogTitle>
            </DialogHeader>
            <MarketListingFormWrapper onClose={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <MadeWithDyad />
    </div>
  );
}