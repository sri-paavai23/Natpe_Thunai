"use client";

import React, { useEffect, useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ShoppingBag } from "lucide-react";
import { Client, Functions, Databases, ID, Query } from 'appwrite';

// Initialize Appwrite client (this should ideally be in a separate lib/appwrite.ts file)
const client = new Client();
client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'YOUR_APPWRITE_ENDPOINT') // Your Appwrite Endpoint
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID || 'YOUR_APPWRITE_PROJECT_ID'); // Your project ID

const functions = new Functions(client);
const databases = new Databases(client);

interface AffiliateListing {
  $id: string;
  title: string;
  description: string;
  original_url: string;
  image_url?: string;
  category?: string;
  brand?: string;
}

const TheEditPage = () => {
  const { userProfile } = useAuth();
  const userId = userProfile?.$id;
  const [listings, setListings] = useState<AffiliateListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);

  // Replace with your actual Appwrite IDs
  const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'YOUR_DATABASE_ID';
  const APPWRITE_COLLECTION_AFFILIATE_LISTINGS_ID = import.meta.env.VITE_APPWRITE_COLLECTION_AFFILIATE_LISTINGS_ID || 'YOUR_AFFILIATE_COLLECTION_ID';
  const APPWRITE_CUELINK_FUNCTION_ID = import.meta.env.VITE_APPWRITE_CUELINK_FUNCTION_ID || 'YOUR_CUELINK_FUNCTION_ID';


  useEffect(() => {
    const fetchAffiliateListings = async () => {
      setLoadingListings(true);
      try {
        const response = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_COLLECTION_AFFILIATE_LISTINGS_ID,
          [Query.limit(100)] // Fetch up to 100 listings
        );
        setListings(response.documents as AffiliateListing[]);
      } catch (error) {
        console.error("Error fetching affiliate listings:", error);
        toast.error("Failed to load listings. Please try again.");
      } finally {
        setLoadingListings(false);
      }
    };

    fetchAffiliateListings();
  }, [APPWRITE_DATABASE_ID, APPWRITE_COLLECTION_AFFILIATE_LISTINGS_ID]);

  const handleBuyNow = async (listingId: string) => {
    if (!userId) {
      toast.error("Please log in to generate affiliate links.");
      return;
    }
    setGeneratingLink(listingId);
    try {
      toast.loading("Generating your deal link...", { id: "cuelink-gen" });
      const response = await functions.createExecution(
        APPWRITE_CUELINK_FUNCTION_ID,
        JSON.stringify({ listingId, userId }),
        false // Set to true if you want to asynchronously execute
      );
      const result = JSON.parse(response.stdout);

      if (result.ok) {
        toast.success("Link generated! Redirecting...", { id: "cuelink-gen" });
        window.open(result.cuelink, '_blank');
      } else {
        toast.error(result.message || "Failed to generate deal link.", { id: "cuelink-gen" });
      }
    } catch (error) {
      console.error("Error calling Appwrite function:", error);
      toast.error("Error generating deal link. Please try again.", { id: "cuelink-gen" });
    } finally {
      setGeneratingLink(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">The Edit</h1>
      <p className="text-center text-muted-foreground mb-8">
        Curated deals and essential products for students. Find the best offers from top brands!
      </p>

      {loadingListings ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading deals...</span>
        </div>
      ) : listings.length === 0 ? (
        <p className="text-center text-muted-foreground">No deals available right now. Check back later!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {listings.map((listing) => (
            <Card key={listing.$id} className="bg-card p-4 rounded-lg shadow-md border border-border hover:shadow-xl transition-shadow flex flex-col">
              {listing.image_url && (
                <img src={listing.image_url} alt={listing.title} className="w-full h-40 object-cover rounded-md mb-4" />
              )}
              <CardHeader className="p-0 pb-2 flex-grow">
                <CardTitle className="text-xl font-semibold text-card-foreground">{listing.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 mb-4 flex-grow">
                <p className="text-muted-foreground text-sm">{listing.description}</p>
                {listing.brand && <p className="text-xs text-gray-500 mt-1">Brand: {listing.brand}</p>}
                {listing.category && <p className="text-xs text-gray-500">Category: {listing.category}</p>}
              </CardContent>
              <Button
                onClick={() => handleBuyNow(listing.$id)}
                disabled={generatingLink === listing.$id || !userId}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {generatingLink === listing.$id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingBag className="mr-2 h-4 w-4" />
                )}
                {generatingLink === listing.$id ? "Getting Deal..." : "Get Deal"}
              </Button>
            </Card>
          ))}
        </div>
      )}
      <MadeWithDyad />
    </div>
  );
};

export default TheEditPage;