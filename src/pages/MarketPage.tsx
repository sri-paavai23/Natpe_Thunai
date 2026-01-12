"use client";

import React, { useState } from "react";
import { MarketWarningBanner } from "@/components/MarketWarningBanner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import MarketTabs from "@/components/MarketTabs";
import MarketListingFormWrapper from "@/components/forms/MarketListingFormWrapper";
import { Plus, Search, Tag, ShoppingBag, RefreshCw, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MadeWithDyad } from "@/components/made-with-dyad";

export default function MarketPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 relative">
      
      {/* --- HERO HEADER --- */}
      <div className="bg-gradient-to-b from-secondary/5 to-background border-b border-border/40 pb-8 pt-6 px-4">
        <div className="max-w-5xl mx-auto space-y-4">
          
          {/* Top Row: Title & Pulse */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-black italic tracking-tighter text-foreground">
                THE <span className="text-secondary-neon text-transparent bg-clip-text bg-gradient-to-r from-secondary-neon to-cyan-400">EXCHANGE</span>
              </h1>
              <p className="text-xs text-muted-foreground font-medium mt-1">
                Buy, Sell, Rent & Donate within your campus network.
              </p>
            </div>
            
            {/* Live Indicator */}
            <Badge variant="outline" className="animate-pulse border-secondary-neon/50 text-secondary-neon bg-secondary-neon/10 gap-1.5 py-1 px-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-neon opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary-neon"></span>
              </span>
              LIVE MARKET
            </Badge>
          </div>

          {/* Warning Banner (Collapsible/Dismissible logic could be added to component) */}
          <MarketWarningBanner />

          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary-neon to-blue-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center">
                <Search className="absolute left-3 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Search for textbooks, cycles, electronics..." 
                    className="pl-10 h-12 bg-card border-border shadow-sm text-lg focus:ring-secondary-neon focus:border-secondary-neon transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </div>

          {/* Quick Stats (Optional Visual Flair) */}
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
             <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full shadow-sm min-w-max">
                <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full"><Tag className="h-3 w-3 text-green-600 dark:text-green-400" /></div>
                <span className="text-xs font-bold">Best Deals</span>
             </div>
             <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full shadow-sm min-w-max">
                <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full"><RefreshCw className="h-3 w-3 text-blue-600 dark:text-blue-400" /></div>
                <span className="text-xs font-bold">Fresh Listings</span>
             </div>
             <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-full shadow-sm min-w-max">
                <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded-full"><Zap className="h-3 w-3 text-purple-600 dark:text-purple-400" /></div>
                <span className="text-xs font-bold">Fast Selling</span>
             </div>
          </div>

        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
        
        {/* Market Content (Tabs contain the grid) */}
        {/* Pass search query down if MarketTabs supports it, otherwise keep it for visual consistency */}
        <MarketTabs initialTab="all" />

      </div>

      {/* --- FAB (Floating Action Button) for Mobile --- */}
      <div className="fixed bottom-20 right-4 z-50 md:bottom-8 md:right-8">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
                size="lg" 
                className="h-14 w-14 rounded-full bg-secondary-neon text-primary-foreground shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:scale-110 hover:shadow-[0_0_30px_rgba(0,243,255,0.6)] transition-all duration-300 flex items-center justify-center p-0"
            >
              <Plus className="h-8 w-8" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
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