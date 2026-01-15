"use client";

import React, { useState, useEffect } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HandCoins, ArrowLeftRight, Users, Banknote } from "lucide-react";
import CashExchangeListings from "@/components/listings/CashExchangeListings"; 
import CashExchangeForm from "@/components/forms/CashExchangeForm"; 
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CASH_EXCHANGE_COLLECTION_ID, Query } from "@/lib/appwrite";

const CashExchangePage = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<"request" | "offer" | "group-contribution">("request");
  
  // Data State
  const [activeTab, setActiveTab] = useState("all");
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Listings
  const fetchListings = async () => {
    setIsLoading(true);
    try {
      const queries = [Query.orderDesc("$createdAt")];
      if (activeTab !== "all") {
        queries.push(Query.equal("type", activeTab));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_CASH_EXCHANGE_COLLECTION_ID,
        queries
      );
      setListings(response.documents);
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [activeTab]);

  const handleOpenForm = (type: "request" | "offer" | "group-contribution") => {
    setFormType(type);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchListings(); 
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-3xl font-bold mb-2 text-center text-foreground flex items-center justify-center gap-2">
        <Banknote className="h-8 w-8 text-secondary-neon" /> Cash Exchange
      </h1>
      <p className="text-center text-muted-foreground text-sm mb-6">
        Peer-to-peer cash assistance & bill splitting.
      </p>

      <div className="max-w-md mx-auto space-y-6">
        
        {/* ACTION BUTTONS - 3 COLUMN GRID */}
        <div className="grid grid-cols-3 gap-3">
          {/* 1. Get Cash */}
          <Button 
            className="flex flex-col h-auto py-4 bg-background border-2 border-red-500/20 hover:border-red-500 hover:bg-red-500/10 transition-all text-red-500"
            variant="outline"
            onClick={() => handleOpenForm("request")}
          >
            <HandCoins className="h-6 w-6 mb-2" />
            <span className="text-xs font-bold leading-tight">Get Cash</span>
          </Button>

          {/* 2. Give Cash */}
          <Button 
            className="flex flex-col h-auto py-4 bg-background border-2 border-green-500/20 hover:border-green-500 hover:bg-green-500/10 transition-all text-green-500"
            variant="outline"
            onClick={() => handleOpenForm("offer")}
          >
            <ArrowLeftRight className="h-6 w-6 mb-2" />
            <span className="text-xs font-bold leading-tight">Give Cash</span>
          </Button>

          {/* 3. Group Split (NEW) */}
          <Button 
            className="flex flex-col h-auto py-4 bg-background border-2 border-blue-500/20 hover:border-blue-500 hover:bg-blue-500/10 transition-all text-blue-500"
            variant="outline"
            onClick={() => handleOpenForm("group-contribution")}
          >
            <Users className="h-6 w-6 mb-2" />
            <span className="text-xs font-bold leading-tight">Split Bill</span>
          </Button>
        </div>

        {/* TABS & LISTINGS */}
        <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="request" className="text-xs">Needs</TabsTrigger>
            <TabsTrigger value="offer" className="text-xs">Offers</TabsTrigger>
            <TabsTrigger value="group-contribution" className="text-xs">Groups</TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
             <CashExchangeListings 
                listings={listings} 
                isLoading={isLoading} 
                type={activeTab as any} 
             />
          </div>
        </Tabs>

      </div>

      {/* FORM DIALOG */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
               {formType === 'request' && <span className="text-red-500 flex gap-2 items-center"><HandCoins className="h-5 w-5"/> Request Cash</span>}
               {formType === 'offer' && <span className="text-green-500 flex gap-2 items-center"><ArrowLeftRight className="h-5 w-5"/> Offer Cash</span>}
               {formType === 'group-contribution' && <span className="text-blue-500 flex gap-2 items-center"><Users className="h-5 w-5"/> Start Group Split</span>}
            </DialogTitle>
          </DialogHeader>
          
          <CashExchangeForm 
             type={formType} 
             onSuccess={handleFormSuccess}
             onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <MadeWithDyad />
    </div>
  );
};

export default CashExchangePage;