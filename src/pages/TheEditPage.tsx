"use client";

import React, { useEffect, useState } from "react";
import { ExecutionMethod } from "appwrite"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2, ShoppingCart, Sparkles } from "lucide-react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { databases, functions, APPWRITE_DATABASE_ID } from "@/lib/appwrite"; 

// --- CONFIGURATION ---
const COLLECTION_ID = "affiliate_listings";
const FUNCTION_ID = "6953da45001e5ab7ad94"; // Your Generate Cuelink Function ID

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

  // --- 1. FETCH DEALS ---
  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await databases.listDocuments(
            APPWRITE_DATABASE_ID, 
            COLLECTION_ID
        );
        setDeals(response.documents as unknown as Deal[]);
      } catch (error: any) {
        console.error("Appwrite Error:", error);
        toast.error("Failed to load deals.");
      } finally {
        setLoading(false);
      }
    };

    if (APPWRITE_DATABASE_ID && COLLECTION_ID) {
      fetchListings();
    } else {
      setLoading(false);
    }
  }, []);

  // --- 2. HANDLE CLICK (GENERATE & REDIRECT) ---
  const handleLootClick = async (listingId: string) => {
    if (!userProfile?.$id) return toast.error("Please login to access deals.");
    
    // A. OPEN POPUP IMMEDIATELY (Bypass Blocker)
    const newWindow = window.open("", "_blank");
    
    if (newWindow) {
        newWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Redirecting to Deal...</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { background-color: #000; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: -apple-system, system-ui, sans-serif; }
                    .spinner { width: 40px; height: 40px; border: 4px solid #333; border-top: 4px solid #10b981; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    h2 { font-weight: 600; margin: 0 0 10px 0; }
                    p { color: #888; font-size: 14px; margin: 0; text-align: center; padding: 0 20px; }
                </style>
            </head>
            <body>
                <div class="spinner"></div>
                <h2>Securing Deal</h2>
                <p>Opening app or website...</p>
            </body>
            </html>
        `);
    }

    setActiveGen(listingId);

    try {
      // B. CALL BACKEND FUNCTION
      const result = await functions.createExecution(
        FUNCTION_ID,                  
        JSON.stringify({              
          listingId: listingId, 
          userId: userProfile.$id 
        }), 
        false,                       
        '/',                          
        ExecutionMethod.POST          
      );
      
      let data;
      try {
          data = JSON.parse(result.responseBody);
      } catch (e) {
          if (newWindow) newWindow.close();
          throw new Error("Invalid server response (Not JSON)");
      }
      
      // Check for backend errors (Status 400/500)
      if (result.responseStatusCode >= 400 || !data.success) {
          if (newWindow) newWindow.close();
          // This ensures the backend error message (e.g. "Missing ID") is thrown
          throw new Error(data.error || "Link generation failed");
      }

      // C. GET LINK & REDIRECT
      const finalLink = data.cueLink || data.cuelink || data.url;

      if (finalLink && newWindow) {
        // Try JS Redirect
        newWindow.location.href = finalLink;

        // Fallback Button (in case JS redirect is blocked or slow)
        setTimeout(() => {
            if (newWindow && !newWindow.closed) {
                newWindow.document.body.innerHTML = `
                    <style>
                        body { background-color: #000; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
                        .btn { background: #10b981; color: #000; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; font-size: 18px; }
                    </style>
                    <h2>Almost there...</h2>
                    <p>If the deal didn't open automatically:</p>
                    <a href="${finalLink}" class="btn">Click Here to Open Deal</a>
                `;
            }
        }, 1500);
      } else {
        if (newWindow) newWindow.close();
        throw new Error("Link generated but URL is empty.");
      }

    } catch (err: any) {
      if (newWindow) newWindow.close();
      console.error("Execution Error:", err);
      
      // --- UPDATED CATCH BLOCK ---
      // This will now show the exact error from the backend (e.g. "DB Error", "Invalid URL")
      toast.error(`Error: ${err.message || "Failed to open deal"}`);
    } finally {
      setActiveGen(null);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-secondary-neon h-8 w-8" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-black italic text-foreground flex justify-center items-center gap-2">
          THE EDIT <Sparkles className="text-secondary-neon h-6 w-6" />
        </h1>
        <p className="text-muted-foreground mt-2">Premium Student Loot • Curated Daily</p>
      </header>

      {deals.length === 0 ? (
        <div className="text-center p-10 border border-dashed rounded-lg border-border">
          <p className="text-muted-foreground">No deals found.</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {deals.map((deal) => (
            <Card key={deal.$id} className="bg-card border-border overflow-hidden flex flex-col hover:border-secondary-neon transition-all duration-300">
              {deal.image_url && (
                <div className="h-48 w-full bg-muted relative">
                  <img src={deal.image_url} alt={deal.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                  <div className="absolute top-2 right-2 bg-black/80 text-secondary-neon text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm">
                    {deal.brand || "LOOT"}
                  </div>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg leading-tight">{deal.title}</CardTitle>
                {deal.category && <p className="text-xs text-secondary-neon uppercase font-bold">{deal.category}</p>}
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <p className="text-sm text-muted-foreground mb-6 line-clamp-3">{deal.description}</p>
                <Button 
                  onClick={() => handleLootClick(deal.$id)}
                  disabled={activeGen === deal.$id}
                  className="w-full bg-foreground text-background hover:bg-secondary-neon hover:text-black font-bold transition-all"
                >
                  {activeGen === deal.$id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
                  {activeGen === deal.$id ? "Opening..." : "Get Loot"}
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