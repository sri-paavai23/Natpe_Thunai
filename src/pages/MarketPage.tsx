"use client";

import React, { useState, useMemo, useEffect } from "react";
import { MarketWarningBanner } from "@/components/MarketWarningBanner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import MarketTabs from "@/components/MarketTabs";
import MarketListingFormWrapper from "@/components/forms/MarketListingFormWrapper";
import { 
  Plus, Search, Tag, ShoppingBag, RefreshCw, Zap, 
  Loader2, ChevronDown, Sparkles, BarChart3 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useMarketListings } from "@/hooks/useMarketListings";
import { cn } from "@/lib/utils";

export default function MarketPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // --- PAGINATION VIBE STATE ---
  const [itemsPerWave, setItemsPerWave] = useState(6);
  const [visibleCount, setVisibleCount] = useState(6);

  // 1. Lifted State: Fetch data here
  const { products, isLoading, error, refetch } = useMarketListings();

  // --- LOGIC: STRICT DEDUPLICATION ---
  // This prevents the "Multi-click" duplicates from ever hitting the UI
  const uniqueProducts = useMemo(() => {
    if (!products) return [];
    const seen = new Set();
    return products.filter((product: any) => {
      // Create a unique fingerprint for the listing
      const fingerprint = `${product.title}-${product.userId}-${product.price}-${product.type}`;
      if (seen.has(fingerprint)) return false;
      seen.add(fingerprint);
      return true;
    });
  }, [products]);

  // --- LOGIC: PROGRESSIVE PAGINATION ---
  const paginatedProducts = useMemo(() => {
    return uniqueProducts.slice(0, visibleCount);
  }, [uniqueProducts, visibleCount]);

  const explorationProgress = (visibleCount / (uniqueProducts.length || 1)) * 100;
  const hasMore = visibleCount < uniqueProducts.length;

  const loadNextWave = () => {
    setVisibleCount(prev => prev + itemsPerWave);
  };

  // Reset pagination on search or refresh
  useEffect(() => {
    setVisibleCount(6);
  }, [searchQuery, products]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 relative overflow-x-hidden">
      
      {/* --- HERO HEADER --- */}
      <div className="bg-gradient-to-b from-secondary/5 to-background border-b border-border/40 pb-6 pt-4 px-4 sticky top-0 z-10 backdrop-blur-md bg-background/80">
        <div className="max-w-md mx-auto space-y-4">
          
          {/* Top Row: Title & Pulse */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter text-foreground">
                THE <span className="text-secondary-neon text-transparent bg-clip-text bg-gradient-to-r from-secondary-neon to-cyan-400">EXCHANGE</span>
              </h1>
              <p className="text-xs text-muted-foreground font-medium mt-1 pr-4 leading-tight">
                Buy, Sell, Rent & Donate on campus.
              </p>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                        refetch();
                        setVisibleCount(6);
                    }} 
                    className="h-8 w-8 text-muted-foreground hover:text-secondary-neon active:scale-90 transition-transform"
                    disabled={isLoading}
                >
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
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
      <div className="max-w-md sm:max-w-5xl mx-auto px-4 mt-4 space-y-8">
        
        {/* Pass Deduplicated & Paginated Data to Tabs */}
        <MarketTabs 
            initialTab="all" 
            products={paginatedProducts} // Only show the current wave
            isLoading={isLoading}
            error={error}
            searchQuery={searchQuery}
        />

        {/* --- INNOVATIVE PAGINATION UI --- */}
        {!isLoading && uniqueProducts.length > 0 && (
          <div className="py-10 flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            
            {/* Exploration Status */}
            <div className="w-full max-w-xs space-y-2">
               <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                  <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Discovery Rate</span>
                  <span>{Math.round(explorationProgress)}%</span>
               </div>
               <Progress value={explorationProgress} className="h-1.5 bg-secondary/10" />
            </div>

            {hasMore ? (
              <Button 
                onClick={loadNextWave}
                variant="outline"
                className="group relative h-12 px-8 rounded-full border-secondary-neon/30 hover:border-secondary-neon bg-background/50 backdrop-blur-sm transition-all duration-500 hover:shadow-[0_0_20px_rgba(0,243,255,0.2)]"
              >
                <div className="flex items-center gap-2 font-bold text-sm tracking-tight group-hover:text-secondary-neon">
                  LOAD NEXT WAVE
                  <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-1" />
                </div>
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground opacity-40">
                <Sparkles className="h-5 w-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">End of the line. You've seen it all.</span>
              </div>
            )}
          </div>
        )}

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
            {/* Modal remains open but blocks re-submission naturally via Form logic */}
            <MarketListingFormWrapper onClose={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <MadeWithDyad />
    </div>
  );
}