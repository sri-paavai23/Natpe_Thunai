"use client";

import React, { useEffect, useState } from "react";
import { Client, Databases, Functions } from "appwrite";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2, ShoppingCart, Sparkles } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";

// --- CONFIGURATION ---
// If your .env variables aren't working, replace these strings with your actual IDs
const API_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID; 
const COLLECTION_ID = "affiliate_listings"; // Ensure this matches your Collection ID exactly
const FUNCTION_ID = "6953da45001e5ab7ad94"; // Ensure this matches your Function ID exactly

// Initialize Appwrite
const client = new Client().setEndpoint(API_ENDPOINT).setProject(PROJECT_ID);
const databases = new Databases(client);
const functions = new Functions(client);

interface Deal {
  $id: string;
  title: string;
  description: string;
  original_url: string;
  image_url?: string;
  brand?: string;
  category?: string;
}

const TheEditPage = () => {
  const { userProfile } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeGen, setActiveGen] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        console.log("Fetching deals from:", DATABASE_ID, COLLECTION_ID); // Debug Log
        
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID
        );
        
        setDeals(response.documents as unknown as Deal[]);
      } catch (error: any) {
        console.error("Appwrite Error:", error); // This will show the real error in Console (F12)
        toast.error(`Error: ${error.message || "Failed to load loot"}`);
      } finally {
        setLoading(false);
      }
    };

    if (DATABASE_ID && COLLECTION_ID) {
      fetchListings();
    } else {
      toast.error("Database configuration missing. Check code.");
      setLoading(false);
    }
  }, []);

  const handleLootClick = async (listingId: string) => {
    if (!userProfile?.$id) return toast.error("Please login to access deals.");
    
    setActiveGen(listingId);
    try {
      const result = await functions.createExecution(
        FUNCTION_ID,
        JSON.stringify({ listingId, userId: userProfile.$id })
      );
      
      const data = JSON.parse(result.responseBody);
      
      // --- MODIFIED DEBUGGING SECTION ---
      if (data.ok) {
        window.open(data.cuelink, "_blank");
      } else {
        // Log the REAL error from the server to the console
        console.error("SERVER ERROR:", data.error); 
        // Show the specific error on screen
        toast.error(`Failed: ${data.error || "Unknown Error"}`); 
      }
      // ----------------------------------

    } catch (err: any) {
      console.error("Execution Error:", err);
      toast.error(`Connection Error: ${err.message}`);
    } finally {
      setActiveGen(null);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-secondary-neon" /></div>;

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-black italic text-foreground flex justify-center items-center gap-2">
          THE EDIT <Sparkles className="text-secondary-neon h-6 w-6" />
        </h1>
        <p className="text-muted-foreground mt-2">Premium Student Loot • Curated Daily</p>
      </header>

      {deals.length === 0 ? (
        <div className="text-center p-10 border border-dashed rounded-lg">
          <p className="text-muted-foreground">No deals found. Check your Appwrite Collection permissions.</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {deals.map((deal) => (
            <Card key={deal.$id} className="bg-card border-border overflow-hidden flex flex-col hover:border-secondary-neon transition-all">
              {deal.image_url && (
                <div className="h-48 w-full bg-muted relative">
                  <img src={deal.image_url} alt={deal.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-secondary-neon text-black text-[10px] font-bold px-2 py-1 rounded">
                    {deal.brand || "TOP DEAL"}
                  </div>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{deal.title}</CardTitle>
                {deal.category && <p className="text-xs text-secondary-neon uppercase font-bold">{deal.category}</p>}
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground mb-6">{deal.description}</p>
                <Button 
                  onClick={() => handleLootClick(deal.$id)}
                  disabled={activeGen === deal.$id}
                  className="w-full bg-foreground text-background hover:bg-secondary-neon hover:text-black transition-colors"
                >
                  {activeGen === deal.$id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
                  Get Loot
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <MadeWithDyad />
    </div>
  );
};

export default TheEditPage;