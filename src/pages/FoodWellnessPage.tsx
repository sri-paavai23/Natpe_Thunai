import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { useCanteenData, FoodOffering } from '@/hooks/useCanteenData';
import CanteenCard from '@/components/CanteenCard';
import FoodOfferingCard from '@/components/FoodOfferingCard';
import PlaceFoodOrderForm from '@/components/forms/PlaceFoodOrderForm';
import { useFoodOrders } from '@/hooks/useFoodOrders';
import { toast } from 'sonner';
import { Utensils, Salad, Coffee, Soup, Pizza, MoreHorizontal } from 'lucide-react';

const foodCategoryIcons = {
  All: Utensils,
  Meals: Salad,
  Beverages: Coffee,
  Snacks: Soup,
  Desserts: Pizza,
  Other: MoreHorizontal,
};

const FoodWellnessPage = () => {
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth();
  const [activeTab, setActiveTab] = useState<"canteens" | "offerings">("canteens");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [isPlaceOrderDialogOpen, setIsPlaceOrderDialogOpen] = useState(false);
  const [selectedOffering, setSelectedOffering] = useState<FoodOffering | null>(null);

  const { allCanteens, allOfferings, isLoading: isLoadingCanteenData, error: canteenError } = useCanteenData();
  const { placeOrder } = useFoodOrders();

  const handlePlaceOrder = (orderData: { offeringId: string; quantity: number; totalPrice: number; deliveryLocation: string; contactNumber: string; notes?: string }) => {
    if (!selectedOffering) return;

    placeOrder({
      offeringId: orderData.offeringId,
      offeringName: selectedOffering.name,
      canteenName: selectedOffering.canteenName,
      quantity: orderData.quantity,
      totalPrice: orderData.totalPrice,
      deliveryLocation: orderData.deliveryLocation,
      contactNumber: orderData.contactNumber,
      notes: orderData.notes,
    });
    setIsPlaceOrderDialogOpen(false);
  };

  const filteredOfferings = activeCategory === "All"
    ? allOfferings
    : allOfferings.filter(offering => offering.category === activeCategory);

  if (isLoadingCanteenData) {
    return <div className="text-center py-8">Loading food data...</div>;
  }

  if (canteenError) {
    return <div className="text-center py-8 text-red-500">Error: {canteenError}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Food & Wellness</h1>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "canteens" | "offerings")} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="canteens">
            <Utensils className="h-4 w-4 mr-2" /> Canteens
          </TabsTrigger>
          <TabsTrigger value="offerings">
            <Salad className="h-4 w-4 mr-2" /> Offerings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="canteens" className="mt-4">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Canteens in {userProfile?.collegeName || "Your College"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCanteens.length > 0 ? (
              allCanteens.map(canteen => (
                <CanteenCard key={canteen.$id} canteen={canteen} />
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground">No canteens found for your college.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="offerings" className="mt-4">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">Food Offerings</h2>
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full mb-4">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
              {Object.entries(foodCategoryIcons).map(([category, Icon]) => (
                <TabsTrigger key={category} value={category}>
                  <Icon className="h-4 w-4 mr-2" /> {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOfferings.length > 0 ? (
              filteredOfferings.map(offering => (
                <FoodOfferingCard
                  key={offering.$id}
                  offering={offering}
                  onOrderClick={() => {
                    setSelectedOffering(offering);
                    setIsPlaceOrderDialogOpen(true);
                  }}
                />
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground">No offerings found in this category.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {selectedOffering && (
        <PlaceFoodOrderForm
          offering={selectedOffering}
          onOrderPlaced={handlePlaceOrder}
          onCancel={() => setIsPlaceOrderDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default FoodWellnessPage;