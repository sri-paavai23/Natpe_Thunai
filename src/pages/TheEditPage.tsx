"use client";

import React, { useEffect, useState } from "react";
import { ExecutionMethod } from "appwrite"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2, ShoppingCart, Sparkles, ExternalLink } from "lucide-react"; 
import { MadeWithDyad } from "@/components/made-with-dyad";
import { databases, functions, APPWRITE_DATABASE_ID } from "@/lib/appwrite"; 

// --- CONFIGURATION ---
const COLLECTION_ID = "affiliate_listings";
const FUNCTION_ID = "6953da45001e5ab7ad94"; // <--- Replace with your actual Function ID

// --- TYPE DEFINITIONS FOR MEDIAN ---
// This allows TypeScript to recognize the median/gonative objects
declare global {
  interface Window {
    median?: {
      window: {
        open: (url: string, type: 'external' | 'internal') => void;
      };
    };
    gonative?: {
      window: {
        open: (url: string, type: 'external' | 'internal') => void;
      };
    };
  }
}

interface Deal {
  $id: string;
  title: string;
  description: string;
  originalURL?: string; 
  originalurl?: string;
  image_url?: string;
  brand?: string;
  category?: string;
}

const TheEditPage = () => {
  const { userProfile } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeGen, setActiveGen] = useState<string | null>(null);
  const [readyLinks, setReadyLinks] = useState<Record<string, string>>({});

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

  // --- UNIVERSAL LINK OPENER ---
  // Handles Desktop, Mobile Web, and Median Native App
  const openLinkSafely = (url: string) => {
    
    // 1. MEDIAN / GONATIVE APP DETECTION
    // This is the specific fix for your "Unknown Error"
    if (window.median) {
        toast.success("Opening in App...");
        window.median.window.open(url, 'external');
        return;
    } 
    if (window.gonative) { // Support for older versions
        toast.success("Opening in App...");
        window.gonative.window.open(url, 'external');
        return;
    }

    // 2. STANDARD MOBILE BROWSER (Chrome/Safari)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Use Anchor Injection for deep linking support
        const link = document.createElement('a');
        link.href = url;
        link.target = "_self"; 
        link.rel = "noopener noreferrer";
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            if (document.body.contains(link)) document.body.removeChild(link);
        }, 500);
        
        // Fallback safety
        setTimeout(() => {
             window.location.href = url;
        }, 1500);
        
        toast.success("Opening App...");
    } 
    // 3. DESKTOP BROWSER
    else {
        window.open(url, "_blank");
    }
  };

  const handleLootClick = async (listingId: string) => {
    toast.info(`Debug: Using Function ID: ${FUNCTION_ID}`);
    if (readyLinks[listingId]) {
        openLinkSafely(readyLinks[listingId]);
        return;
    }

    if (!userProfile?.$id) return toast.error("Please login to access deals.");
    
    // PRE-LOADER WINDOW (Desktop Only)
    // We skip this for Median/Mobile to avoid flashing screens
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isMedian = window.median || window.gonative;
    let newWindow: Window | null = null;

    if (!isMobile && !isMedian) {
        newWindow = window.open("", "_blank");
        if (newWindow) {
            newWindow.document.write(`
                <html><body style="background:#09090b;color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">
                <div style="border:4px solid #333;border-top:4px solid #10b981;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin-bottom:20px;"></div>
                <h2 style="margin:0;">Securing Deal...</h2>
                <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
                </body></html>
            `);
        }
    }

    setActiveGen(listingId);

    try {
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
          throw new Error("Invalid server response");
      }
      
      if (!data.success || !data.cueLink) {
          if (newWindow) newWindow.close();
          throw new Error(data.error || "Link generation failed");
      }

      const finalLink = data.cueLink;
      setReadyLinks(prev => ({ ...prev, [listingId]: finalLink }));

      // HANDOFF TO OPENER
      if (newWindow) {
          newWindow.location.href = finalLink;
      } else {
          openLinkSafely(finalLink);
      }

    } catch (err: any) {
      if (newWindow) newWindow.close();
      console.error("Execution Error:", err);
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
                  className={`w-full font-bold transition-all ${
                    readyLinks[deal.$id] 
                        ? "bg-green-500 hover:bg-green-600 text-white" 
                        : "bg-foreground text-background hover:bg-secondary-neon hover:text-black"
                  }`}
                >
                  {activeGen === deal.$id ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
                        Fetching...
                    </>
                  ) : readyLinks[deal.$id] ? (
                    <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Again
                    </>
                  ) : (
                    <>
                        <ShoppingCart className="h-4 w-4 mr-2" /> 
                        Get Loot
                    </>
                  )}
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