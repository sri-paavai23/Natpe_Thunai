"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, PlusCircle, Frown, Smile, Loader2, MapPin, Calendar, MessageSquareText, CheckCircle, ArrowLeft, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useLostAndFoundListings, LostFoundItem } from "@/hooks/useLostAndFoundListings";
import PostLostItemForm from "@/components/forms/PostLostItemForm";
import PostFoundItemForm from "@/components/forms/PostFoundItemForm";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Import Alert components
import LostAndFoundItemList from "@/components/LostAndFoundItemList"; // NEW IMPORT

const LostAndFoundPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, isLoading, error, updateItemStatus } = useLostAndFoundListings();
  const [isPostLostDialogOpen, setIsPostLostDialogOpen] = useState(false);
  const [isPostFoundDialogOpen, setIsPostFoundDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "lost" | "found">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = items.filter(item => {
    const matchesSearch = searchTerm.trim() === "" ||
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === "all" || item.type === activeTab;

    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-secondary-neon">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Activity
        </Button>
        
        <h1 className="text-4xl font-bold text-center text-foreground">Lost & Found</h1>

        {/* NEW: Warning Card */}
        <Alert variant="default" className="bg-yellow-100 border-yellow-500 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-600 dark:text-yellow-400 font-semibold">Important Notice</AlertTitle>
          <AlertDescription className="text-sm space-y-2">
            <p>While this platform helps connect lost items with owners, we strongly advise reporting all lost items to your institution's official Lost & Found department as well. This increases the chances of recovery.</p>
            <p>For **valuable items** (e.g., laptops, expensive phones, wallets), it is highly recommended to **directly contact your institution's security or administration** instead of posting full details here. This helps prevent potential misuse and ensures a more secure return process.</p>
          </AlertDescription>
        </Alert>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Search className="h-5 w-5 text-secondary-neon" /> Find or Post Items
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Help your peers by reporting found items, or get help finding your lost belongings.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Dialog open={isPostLostDialogOpen} onOpenChange={setIsPostLostDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-1/2 bg-destructive text-primary-foreground hover:bg-destructive/90">
                    <Frown className="mr-2 h-4 w-4" /> Post Lost Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Report a Lost Item</DialogTitle>
                  </DialogHeader>
                  <PostLostItemForm onItemPosted={() => setIsPostLostDialogOpen(false)} onCancel={() => setIsPostLostDialogOpen(false)} />
                </DialogContent>
              </Dialog>
              <Dialog open={isPostFoundDialogOpen} onOpenChange={setIsPostFoundDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-1/2 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                    <Smile className="mr-2 h-4 w-4" /> Post Found Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Report a Found Item</DialogTitle>
                  </DialogHeader>
                  <PostFoundItemForm onItemPosted={() => setIsPostFoundDialogOpen(false)} onCancel={() => setIsPostFoundDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search items by name, description, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "lost" | "found")} className="w-full">
          <TabsList className="flex w-full overflow-x-auto whitespace-nowrap bg-primary-blue-light text-primary-foreground h-auto p-1 rounded-md shadow-sm scrollbar-hide">
            <TabsTrigger value="all" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">All Items</TabsTrigger>
            <TabsTrigger value="lost" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Lost Items</TabsTrigger>
            <TabsTrigger value="found" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Found Items</TabsTrigger>
          </TabsList>
          <div className="mt-4 space-y-4">
            <TabsContent value="all">
              <LostAndFoundItemList items={filteredItems} isLoading={isLoading} error={error} updateItemStatus={updateItemStatus} />
            </TabsContent>
            <TabsContent value="lost">
              <LostAndFoundItemList items={filteredItems} isLoading={isLoading} error={error} updateItemStatus={updateItemStatus} />
            </TabsContent>
            <TabsContent value="found">
              <LostAndFoundItemList items={filteredItems} isLoading={isLoading} error={error} updateItemStatus={updateItemStatus} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default LostAndFoundPage;