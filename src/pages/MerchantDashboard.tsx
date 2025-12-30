"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID } from '@/lib/appwrite';
import { ID } from 'appwrite';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Store, Utensils } from 'lucide-react';
import { toast } from 'sonner';

export default function MerchantDashboard() {
  const { user, userProfile } = useAuth();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("food"); // food or product

  if (!userProfile || userProfile.userType !== 'merchant') {
    return <div className="p-8 text-center text-destructive">Access Denied. Merchant account required.</div>;
  }

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) {
      toast.error("Title and Price are required.");
      return;
    }

    try {
      const collectionId = category === 'food' 
        ? APPWRITE_FOOD_ORDERS_COLLECTION_ID 
        : APPWRITE_PRODUCTS_COLLECTION_ID;

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        collectionId,
        ID.unique(),
        {
          title,
          price: parseFloat(price), // Ensure price is stored as a number
          description: "Merchant Offering",
          sellerId: user?.$id,
          sellerName: userProfile.merchantName,
          isMerchantListing: true,
          servedCollegeIds: userProfile.servedCollegeIds, // Crucial: Targets multiple colleges
          status: 'available',
          collegeName: 'All Served Colleges', // Generic display name for merchant listings
          category: category === 'food' ? 'homemade-meals' : 'electronics', // Default for demo, adjust as needed
          postedAt: new Date().toISOString(),
        }
      );
      toast.success("Listing created successfully!");
      setTitle("");
      setPrice("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create listing");
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Store className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">Merchant Dashboard: {userProfile.merchantName}</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader><CardTitle>Served Colleges</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{userProfile.servedCollegeIds?.length || 0}</CardContent>
        </Card>
        {/* Add more stats like "Active Orders" here */}
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create New Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateListing} className="space-y-4">
            <div className="flex gap-4">
              <Button 
                type="button" 
                variant={category === 'food' ? 'default' : 'outline'}
                onClick={() => setCategory('food')}
              >
                <Utensils className="mr-2 h-4 w-4" /> Food Item
              </Button>
              <Button 
                type="button" 
                variant={category === 'product' ? 'default' : 'outline'}
                onClick={() => setCategory('product')}
              >
                <Store className="mr-2 h-4 w-4" /> Exchange Product
              </Button>
            </div>
            
            <Input 
              placeholder="Item Title (e.g., Combo Meal A)" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              required
            />
            <Input 
              placeholder="Price (e.g., ₹150)" 
              value={price} 
              onChange={(e) => setPrice(e.target.value)} 
              type="number"
              step="0.01"
              required
            />
            <Button type="submit" className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Publish Listing
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}