"use client";

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { toast } from "sonner";
import { getColleges, getCollegeNameById } from "@/lib/utils";

interface Product {
  $id: string;
  title: string;
  description: string;
  price: number;
  type: 'sell' | 'rent';
  status: 'available' | 'sold' | 'rented';
  sellerId: string;
  servedCollegeIds: string[];
  imageUrl?: string;
  sellerName?: string; // To store seller's name
}

const Exchange: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCollege, setFilterCollege] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const colleges = getColleges();

  useEffect(() => {
    fetchProducts();
  }, [filterCollege, filterType]);

  const fetchProducts = async () => {
    try {
      const queries = [Query.equal('status', 'available')]; // Only show available products

      if (filterCollege) {
        queries.push(Query.search('servedCollegeIds', filterCollege));
      }
      if (filterType) {
        queries.push(Query.equal('type', filterType));
      }

      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_PRODUCTS_COLLECTION_ID,
        queries
      );

      const productsWithSellerNames = await Promise.all(
        response.documents.map(async (productDoc) => {
          const product = productDoc as unknown as Product;
          try {
            const sellerProfileResponse = await databases.listDocuments(
              APPWRITE_DATABASE_ID,
              APPWRITE_USER_PROFILES_COLLECTION_ID,
              [Query.equal('userId', product.sellerId), Query.limit(1)]
            );
            if (sellerProfileResponse.documents.length > 0) {
              const sellerProfile = sellerProfileResponse.documents[0];
              product.sellerName = sellerProfile.merchantName || `${sellerProfile.firstName} ${sellerProfile.lastName}`;
            }
          } catch (profileError) {
            console.warn(`Could not fetch seller profile for product ${product.$id}:`, profileError);
            product.sellerName = "Unknown Seller";
          }
          return product;
        })
      );

      setProducts(productsWithSellerNames);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load products.");
    }
  };

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sellerName && product.sellerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Exchange Market</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Input
          placeholder="Search products or sellers..."
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
          <Select onValueChange={setFilterType} value={filterType || ""}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="sell">For Sale</SelectItem>
              <SelectItem value="rent">For Rent</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => {
            setFilterCollege(null);
            setFilterType(null);
            setSearchTerm("");
            fetchProducts();
          }}>
            <Filter className="h-4 w-4 mr-2" /> Reset Filters
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.length === 0 ? (
          <p className="text-muted-foreground col-span-full">No products found matching your criteria.</p>
        ) : (
          filteredProducts.map((product) => (
            <Card key={product.$id} className="flex flex-col">
              {product.imageUrl && (
                <img src={product.imageUrl} alt={product.title} className="w-full h-48 object-cover rounded-t-lg" />
              )}
              <CardHeader>
                <CardTitle>{product.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{product.type === 'sell' ? 'For Sale' : 'For Rent'}</p>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                <p className="font-semibold text-lg">₹{product.price}</p>
                <p className="text-xs text-muted-foreground">
                  Available in: {product.servedCollegeIds.map(getCollegeNameById).join(', ')}
                </p>
                {product.sellerName && (
                  <p className="text-xs text-muted-foreground mt-1">Seller: {product.sellerName}</p>
                )}
              </CardContent>
              <div className="p-4 border-t">
                <Button className="w-full">View Details</Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Exchange;