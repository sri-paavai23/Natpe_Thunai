"use client";

    import React, { useState } from "react";
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
    import SellListingForm from "./SellListingForm";
    import RentListingForm from "./RentListingForm";
    import GiftCraftListingForm from "./GiftCraftListingForm";
    import SportsGearListingForm from "./SportsGearListingForm";
    import { toast } from "sonner";
    import { useAuth } from "@/context/AuthContext";
    import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID } from "@/lib/appwrite";
    import { ID } from 'appwrite';
    import { cn } from '@/lib/utils';
    import DeletionInfoMessage from "@/components/DeletionInfoMessage";

    interface MarketListingFormWrapperProps {
      onClose: () => void;
    }

    const MarketListingFormWrapper: React.FC<MarketListingFormWrapperProps> = ({ onClose }) => {
      const [activeTab, setActiveTab] = useState<"sell" | "rent" | "gift" | "sports">("sell");
      const { user, userProfile, recordMarketListing } = useAuth();

      const handleListingSubmit = async (data: any, type: "Sell" | "Rent" | "Gift/Craft" | "Sports Gear") => {
        if (!user || !userProfile) {
          toast.error("You must be logged in and have a complete profile to create a listing.");
          return;
        }
        if (!userProfile.collegeName) {
          toast.error("Your profile is missing college information. Please update your profile first.");
          return;
        }

        const productType = type === "Sell" ? "sell" : type === "Rent" ? "rent" : type === "Gift/Craft" ? "gift" : "sports";
        
        const newProductData = {
          // Core Product Fields
          title: data.title,
          price: data.price, // e.g., "₹450.00" or "₹15.00/day"
          description: data.description,
          imageUrl: data.imageUrl,
          type: productType,
          
          // Seller Info (from Auth Context)
          userId: user.$id,
          sellerName: user.name,
          sellerUpiId: userProfile.upiId,
          collegeName: userProfile.collegeName,
          
          // Mocked/Default Fields
          sellerRating: 5.0, // Default high rating for new sellers
          location: "Campus Area", // Placeholder location
          status: "available", // NEW: Default status for new listings
          
          // Type-specific fields (using null for fields not applicable to the current type)
          category: data.category || null, // Used by Sell
          damages: data.damages || null, // Used by Sell/Sports
          condition: data.condition || null, // Used by Sell/Sports
          policies: data.policies || null, // Used by Rent
          
          // Delivery/Ambassador Info
          ambassadorDelivery: data.ambassadorDelivery,
          ambassadorMessage: data.ambassadorMessage || null,
        };

        try {
          await databases.createDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_PRODUCTS_COLLECTION_ID,
            ID.unique(),
            newProductData
          );
          
          toast.success(`New ${type} listing created successfully!`);
          recordMarketListing(type);
          onClose();
        } catch (error: any) {
          console.error(`Error creating ${type} listing:`, error);
          toast.error(error.message || `Failed to create ${type} listing. Check Appwrite permissions and schema.`);
        }
      };

      return (
        <div className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Listing</DialogTitle>
          </DialogHeader>
          <DeletionInfoMessage />
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "sell" | "rent" | "gift" | "sports")}>
            <TabsList className="flex w-full overflow-x-auto whitespace-nowrap bg-muted p-1 text-muted-foreground rounded-md shadow-sm scrollbar-hide">
              <TabsTrigger value="sell" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Sell</TabsTrigger>
              <TabsTrigger value="rent" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Rent</TabsTrigger>
              <TabsTrigger value="gift" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Handcrafts & Gifts</TabsTrigger>
              <TabsTrigger value="sports" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Sports Gear</TabsTrigger>
            </TabsList>

            <TabsContent value="sell" className="mt-4">
              <SellListingForm 
                onSubmit={(data) => handleListingSubmit(data, "Sell")} 
                onCancel={onClose} 
              />
            </TabsContent>
            
            <TabsContent value="rent" className="mt-4">
              <RentListingForm 
                onSubmit={(data) => handleListingSubmit(data, "Rent")} 
                onCancel={onClose} 
              />
            </TabsContent>
            
            <TabsContent value="gift" className="mt-4">
              <GiftCraftListingForm 
                onSubmit={(data) => handleListingSubmit(data, "Gift/Craft")} 
                onCancel={onClose} 
              />
            </TabsContent>
            
            <TabsContent value="sports" className="mt-4">
              <SportsGearListingForm 
                onSubmit={(data) => handleListingSubmit(data, "Sports Gear")} 
                onCancel={onClose} 
              />
            </TabsContent>
          </Tabs>
        </div>
      );
    };

    export default MarketListingFormWrapper;