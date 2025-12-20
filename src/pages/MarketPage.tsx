"use client";

import React, { useState } from "react";
import { MarketWarningBanner } from "@/components/MarketWarningBanner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import MarketTabs from "@/components/MarketTabs";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID,APPWRITE_SERVICE_REVIEWS_COLLECTION_ID } from "@/lib/appwrite";
import MarketListingFormWrapper from "@/components/forms/MarketListingFormWrapper";
import { PlusCircle } from "lucide-react";

export default function MarketPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="container mx-auto p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">The Exchange (Market)</h1>
      
      <div className="max-w-4xl mx-auto space-y-6">
        <MarketWarningBanner />
        
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-foreground">Listings</h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
              <MarketListingFormWrapper onClose={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <MarketTabs initialTab="all" />
      </div>
    </div>
  );
}