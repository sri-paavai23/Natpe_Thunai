"use client";

import React, { useEffect, useState } from "react";
import { ExecutionMethod } from "appwrite"; 
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2, ShoppingBag, Sparkles, ExternalLink, Tag, Zap } from "lucide-react"; 
import { MadeWithDyad } from "@/components/made-with-dyad";
import { databases, functions, APPWRITE_DATABASE_ID } from "@/lib/appwrite"; 

// --- CONFIGURATION ---
const COLLECTION_ID = "affiliate_listings";
const FUNCTION_ID = "6953da45001e5ab7ad94"; 

// --- TYPE DEFINITIONS ---
declare global {
  interface Window {
    median?: { window: { open: (url: string, type: 'external' | 'internal') => void; }; };
    gonative?: { window: { open: (url: string, type: 'external' | 'internal') => void; }; };
  }
}

interface Deal {
  $id: string;
  title: string;
  description: string;
  originalURL?: string; 
  image_url?: string;
  brand?: string;
  category?: string;
  price?: string; // Optional: If you have pricing data
}

// --- COMPONENT: DEAL CARD ---
// Extracted to handle image fallback state independently
const DealCard = ({ 
  deal, 
  onClick, 
  isLoading, 
  isReady 
}: { 
  deal: Deal, 
  onClick: (id: string) => void, 
  isLoading: boolean, 
  isReady: boolean 
}) => {
  const [imageError, setImageError] = useState(false);

  // Determine which image to show
  const showImage = deal.image_url && !imageError;

  return (
    <Card className="group relative flex flex-col overflow-hidden border-border/50 bg-card transition-all duration-300 hover:border-secondary-neon/50 hover:shadow-[0_0_25px_rgba(0,243,255,0.15)]">
      
      {/* --- IMAGE AREA --- */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted/50">
        {showImage ? (
          <img 
            src={deal.image_url} 
            alt={deal.title} 
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          // FALLBACK: Stylish Placeholder (App Logo Vibe)
          <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-background to-secondary/10">
            <div className="rounded-full bg-secondary-neon/10 p-4 ring-1 ring-secondary-neon/30">
               <ShoppingBag className="h-8 w-8 text-secondary-neon opacity-70" />
            </div>
            <span className="mt-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">The Grind Loot</span>
          </div>
        )}

        {/* Floating Badges */}
        <div className="absolute top-2 left-2 flex gap-2">
            {deal.category && (
                <Badge variant="secondary" className="bg-background/80 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm">
                    {deal.category}
                </Badge>
            )}
        </div>
        
        {deal.brand && (
            <div className="absolute top-2 right-2">
                <Badge className="bg-black/70 text-white backdrop-blur-md border-0 text-[10px] font-bold">
                    {deal.brand}
                </Badge>
            </div>
        )}
      </div>

      {/* --- CONTENT AREA --- */}
      <CardContent className="flex flex-grow flex-col p-4">
        <h3 className="mb-2 text-lg font-bold leading-tight text-foreground line-clamp-2 group-hover:text-secondary-neon transition-colors">
            {deal.title}
        </h3>
        <p className="flex-grow text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {deal.description}
        </p>
      </CardContent>

      {/* --- FOOTER / CTA --- */}
      <CardFooter className="p-4 pt-0">
        <Button 
            onClick={() => onClick(deal.$id)}
            disabled={isLoading}
            className={`w-full h-10 text-sm font-bold shadow-lg transition-all duration-300 
                ${isReady 
                    ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/20" 
                    : "bg-gradient-to-r from-secondary-neon to-blue-600 text-white hover:opacity-90 shadow-cyan-500/20"
                }
            `}
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Unlocking...
                </>
            ) : isReady ? (
                <>
                    <ExternalLink className="mr-2 h-4 w-4" /> 
                    Open Deal
                </>
            ) : (
                <>
                    <Zap className="mr-2 h-4 w-4 fill-current" /> 
                    Grab Loot
                </>
            )}
        </Button>
      </CardFooter>
    </Card>
  );
};

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

  const openLinkSafely = (url: string) => {
    if (window.median) {
      toast.success("Opening in App...");
      window.median.window.open(url, 'external');
      return;
    } 
    if (window.gonative) {
      toast.success("Opening in App...");
      window.gonative.window.open(url, 'external');
      return;
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
        const link = document.createElement('a');
        link.href = url;
        link.target = "_self"; 
        link.rel = "noopener noreferrer";
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => { if (document.body.contains(link)) document.body.removeChild(link); }, 500);
        setTimeout(() => { window.location.href = url; }, 1500);
        
        toast.success("Opening App...");
    } else {
        window.open(url, "_blank");
    }
  };

  const handleLootClick = async (listingId: string) => {
    if (readyLinks[listingId]) {
        openLinkSafely(readyLinks[listingId]);
        return;
    }

    if (!userProfile?.$id) return toast.error("Please login to access deals.");
    
    toast.info(`Securing exclusive deal...`);
    setActiveGen(listingId);

    // Desktop Pre-loader Logic
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isMedian = window.median || window.gonative;
    let newWindow: Window | null = null;

    if (!isMobile && !isMedian) {
        newWindow = window.open("", "_blank");
        if (newWindow) {
            newWindow.document.write(`
                <html><body style="background:#09090b;color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">
                <div style="border:4px solid #333;border-top:4px solid #00f3ff;border-radius:50%;width:40px;height:40px;animation:spin 1s linear infinite;margin-bottom:20px;"></div>
                <h2 style="margin:0;">Unlocking Deal...</h2>
                <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
                </body></html>
            `);
        }
    }

    try {
      const result = await functions.createExecution(
        FUNCTION_ID,                  
        JSON.stringify({ listingId: listingId, userId: userProfile.$id }), 
        false,                       
        '/',                          
        ExecutionMethod.POST          
      );
      
      let data;
      try { data = JSON.parse(result.responseBody); } 
      catch (e) { if (newWindow) newWindow.close(); throw new Error("Invalid server response"); }
      
      if (!data.success || !data.cueLink) {
          if (newWindow) newWindow.close();
          throw new Error(data.error || "Link generation failed");
      }

      const finalLink = data.cueLink;
      setReadyLinks(prev => ({ ...prev, [listingId]: finalLink }));

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
    <div className="h-screen flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-secondary-neon h-10 w-10" />
      <p className="text-sm text-muted-foreground animate-pulse">Loading Curated Loot...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-4 pb-24 relative overflow-x-hidden">
      
      {/* Background Decor */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-secondary-neon/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <header className="text-center mb-8 pt-4">
        <h1 className="text-4xl font-black italic text-foreground flex justify-center items-center gap-2 tracking-tighter">
          THE <span className="text-secondary-neon text-transparent bg-clip-text bg-gradient-to-r from-secondary-neon to-cyan-400">EDIT</span>
        </h1>
        <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center justify-center gap-1">
           <Tag className="h-3 w-3" /> Campus Exclusive Deals
        </p>
      </header>

      {deals.length === 0 ? (
        <div className="text-center p-12 border border-dashed rounded-xl border-border bg-card/50">
          <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground font-medium">No fresh loot drops yet.</p>
          <p className="text-xs text-muted-foreground/70">Check back later for new deals.</p>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {deals.map((deal) => (
            <DealCard 
                key={deal.$id} 
                deal={deal} 
                onClick={handleLootClick}
                isLoading={activeGen === deal.$id}
                isReady={!!readyLinks[deal.$id]}
            />
          ))}
        </div>
      )}
      
      <div className="mt-8">
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default TheEditPage;