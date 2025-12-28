import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { useErrandListings, ErrandType } from '@/hooks/useErrandListings'; // Reusing errand listings for short-term needs
import ErrandCard from '@/components/ErrandCard'; // Reusing ErrandCard
import PostErrandForm from '@/components/forms/PostErrandForm'; // Reusing PostErrandForm
import { toast } from 'sonner';
import { Package, ShoppingCart, Truck, BookOpen, MoreHorizontal } from 'lucide-react';

const errandTypeIcons = {
  Delivery: Truck,
  Pickup: Package,
  Shopping: ShoppingCart,
  "Academic Help": BookOpen,
  Other: MoreHorizontal,
};

const ShortTermNeedsPage = () => { // Renamed to PostANeedPage in summary, but keeping file name for now
  const { user, userProfile } = useAuth();
  const [activeType, setActiveType] = useState<ErrandType | "All">("All");
  const [isPostErrandDialogOpen, setIsPostErrandDialogOpen] = useState(false);

  const { errands, isLoading, error, refetch } = useErrandListings(
    activeType === "All" ? [] : [activeType]
  );

  const handlePostErrandSuccess = () => {
    setIsPostErrandDialogOpen(false);
    refetch();
    toast.success("Short-term need posted successfully!");
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading short-term needs...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Short-Term Needs</h1>

      <div className="flex justify-end mb-4">
        <Dialog open={isPostErrandDialogOpen} onOpenChange={setIsPostErrandDialogOpen}>
          <DialogTrigger asChild>
            <Button>Post a Need</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Post a Short-Term Need</DialogTitle>
              <DialogDescription>
                Need help with something urgent? Post it here!
              </DialogDescription>
            </DialogHeader>
            <PostErrandForm onSuccess={handlePostErrandSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeType} onValueChange={(value) => setActiveType(value as ErrandType | "All")} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="All">
            <Package className="h-4 w-4 mr-2" /> All Needs
          </TabsTrigger>
          {Object.entries(errandTypeIcons).map(([type, Icon]) => (
            <TabsTrigger key={type} value={type}>
              <Icon className="h-4 w-4 mr-2" /> {type}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeType} className="mt-4">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            {activeType === "All" ? "All Short-Term Needs" : `${activeType} Needs`}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {errands.length > 0 ? (
              errands.map(errand => (
                <ErrandCard key={errand.$id} errand={errand} />
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground">No short-term needs found in this category.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ShortTermNeedsPage;