"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_FOOD_ORDERS_COLLECTION_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { toast } from "sonner";
import { getColleges, getCollegeNameById } from "@/lib/utils";

interface FoodOffering {
  $id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  status: 'available' | 'unavailable';
  sellerId: string;
  servedCollegeIds: string[];
  imageUrl?: string;
  sellerName?: string; // To store seller's name
}

const FoodAndWellness: React.FC = () => {
  const [foodOfferings, setFoodOfferings] = useState<FoodOffering[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCollege, setFilterCollege] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const colleges = getColleges();

  useEffect(() => {
    fetchFoodOfferings();
  }, [filterCollege, filterCategory]);

  const fetchFoodOfferings = async () => {
    try {
      const queries = [Query.equal('status', 'available')]; // Only show available offerings

      if (filterCollege) {
        queries.push(Query.search('servedCollegeIds', filterCollege));
      }
      if (filterCategory) {
        queries.push(Query.equal('category', filterCategory));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_FOOD_ORDERS_COLLECTION_ID,
        queries
      );

      const offeringsWithSellerNames = await Promise.all(
        response.documents.map(async (foodDoc) => {
          const food = foodDoc as unknown as FoodOffering;
          try {
            const sellerProfileResponse = await databases.listDocuments(
              APPWRITE_DATABASE_ID,
              APPWRITE_USER_PROFILES_COLLECTION_ID,
              [Query.equal('userId', food.sellerId), Query.limit(1)]
            );
            if (sellerProfileResponse.documents.length > 0) {
              const sellerProfile = sellerProfileResponse.documents[0];
              food.sellerName = sellerProfile.merchantName || `${sellerProfile.firstName} ${sellerProfile.lastName}`;
            }
          } catch (profileError) {
            console.warn(`Could not fetch seller profile for food offering ${food.$id}:`, profileError);
            food.sellerName = "Unknown Seller";
          }
          return food;
        })
      );

      setFoodOfferings(offeringsWithSellerNames);
    } catch (error) {
      console.error("Failed to fetch food offerings:", error);
      toast.error("Failed to load food offerings.");
    }
  };

  const filteredFoodOfferings = foodOfferings.filter(food =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    food.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (food.sellerName && food.sellerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Extract unique categories for filtering
  const categories = Array.from(new Set(foodOfferings.map(f => f.category)));

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Food & Wellness</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search food, categories or sellers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <div className="flex gap-2">
          <Select onValueChange={setFilterCollege} value={filterCollege || ""}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by College" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colleges</SelectItem>
              {colleges.map((college) => (
                <SelectItem key={college.id} value={college.id}>
                  {college.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={setFilterCategory} value={filterCategory || ""}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => {
            setFilterCollege(null);
            setFilterCategory(null);
            setSearchTerm("");
            fetchFoodOfferings();
          }}>
            <Filter className="h-4 w-4 mr-2" /> Reset Filters
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredFoodOfferings.length === 0 ? (
          <p className="text-muted-foreground col-span-full">No food offerings found matching your criteria.</p>
        ) : (
          filteredFoodOfferings.map((food) => (
            <Card key={food.$id} className="flex flex-col">
              {food.imageUrl && (
                <img src={food.imageUrl} alt={food.name} className="w-full h-48 object-cover rounded-t-lg" />
              )}
              <CardHeader>
                <CardTitle>{food.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{food.category}</p>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground mb-2">{food.description}</p>
                <p className="font-semibold text-lg">₹{food.price}</p>
                <p className="text-xs text-muted-foreground">
                  Available in: {food.servedCollegeIds.map(getCollegeNameById).join(', ')}
                </p>
                {food.sellerName && (
                  <p className="text-xs text-muted-foreground mt-1">Seller: {food.sellerName}</p>
                )}
              </CardContent>
              <div className="p-4 border-t">
                <Button className="w-full">Order Now</Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default FoodAndWellness;