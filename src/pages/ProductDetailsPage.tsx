"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID, APPWRITE_SERVICE_REVIEWS_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Loader2, ArrowLeft, MapPin, Star, ShieldCheck, 
  ShoppingCart, MessageCircle, AlertTriangle, ChevronDown, Gavel 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import BuyProductDialog from "@/components/forms/BuyProductDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// --- HELPER: GOOGLE DRIVE IMAGE FIX ---
const getOptimizedImageUrl = (url?: string) => {
  if (!url) return "/icons/icon-512x512.png"; // Immediate fallback if empty
  
  // Check if it's a Google Drive "view" link
  if (url.includes("drive.google.com") && url.includes("/view")) {
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      // Convert to direct export link
      return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
    }
  }
  return url;
};

const ProductDetailsPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Image Handling State
  const [displayImage, setDisplayImage] = useState<string>("/icons/icon-512x512.png");
  const [imageError, setImageError] = useState(false);

  // Interactive State
  const [currentPrice, setCurrentPrice] = useState<string>("0");
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false);
  const [isBargainDialogOpen, setIsBargainDialogOpen] = useState(false);
  const [bargainAmount, setBargainAmount] = useState("");
  const [isNegotiating, setIsNegotiating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) return;
      try {
        const productDoc = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_PRODUCTS_COLLECTION_ID,
          productId
        );
        setProduct(productDoc);
        setCurrentPrice(productDoc.price); 
        
        // Initialize Image with Optimization
        const optimizedUrl = getOptimizedImageUrl(productDoc.imageUrl);
        setDisplayImage(optimizedUrl);

        const reviewsRes = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_SERVICE_REVIEWS_COLLECTION_ID,
          [Query.equal("serviceId", productId), Query.orderDesc("$createdAt")]
        );
        setReviews(reviewsRes.documents);

      } catch (error) {
        console.error("Error fetching details:", error);
        toast.error("Product not found.");
        navigate("/market");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, navigate]);

  // --- BARGAIN LOGIC ---
  const handleBargain = () => {
    if (!bargainAmount) return;
    setIsNegotiating(true);

    setTimeout(() => {
        setIsNegotiating(false);
        setIsBargainDialogOpen(false);
        
        const newPrice = `₹${bargainAmount}`;
        setCurrentPrice(newPrice);
        
        toast.success("Offer Accepted! Price updated.", {
            description: "The seller agreed to your price. You can now buy it.",
            icon: <Gavel className="h-4 w-4 text-green-500" />
        });
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-neon" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen bg-background pb-28 relative">
      
      {/* --- HEADER --- */}
      <div className="sticky top-0 z-20 flex items-center p-3 bg-background/80 backdrop-blur-xl border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-sm ml-2 truncate">Product Details</span>
      </div>

      <div className="max-w-3xl mx-auto">
        
        {/* --- PRODUCT IMAGE --- */}
        <div className="w-full aspect-square sm:aspect-video bg-muted relative overflow-hidden group flex items-center justify-center bg-secondary/5">
          <img 
            src={displayImage}
            alt={product.title}
            className={`w-full h-full object-contain transition-transform duration-500 group-hover:scale-105 ${imageError ? 'p-12 opacity-80' : ''}`}
            onError={() => { 
                setImageError(true);
                setDisplayImage("/icons/icon-512x512.png"); 
            }}
          />
          {/* Badge Overlay */}
          <div className="absolute top-4 left-4">
             <Badge className="bg-background/90 text-foreground backdrop-blur border border-border/50 shadow-sm uppercase tracking-wider text-[10px]">
                {product.type}
             </Badge>
          </div>
        </div>

        {/* --- MAIN INFO --- */}
        <div className="p-5 space-y-6">
          
          {/* Title & Price */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground leading-tight">{product.title}</h1>
            <div className="flex items-center gap-2">
               <p className="text-3xl font-black text-secondary-neon animate-in fade-in zoom-in duration-300 key={currentPrice}">
                  {currentPrice}
               </p>
               {product.price !== currentPrice && (
                   <span className="text-sm text-muted-foreground line-through decoration-destructive">{product.price}</span>
               )}
            </div>
            {product.condition && (
               <Badge variant="secondary" className="mt-2 text-xs font-medium">
                 Condition: {product.condition}
               </Badge>
            )}
          </div>

          <Separator />

          {/* --- SELLER CARD --- */}
          <div className="flex items-center justify-between bg-card border border-border/50 p-4 rounded-xl shadow-sm">
             <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-secondary-neon/20">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${product.sellerName}`} />
                  <AvatarFallback>S</AvatarFallback>
                </Avatar>
                <div>
                   <div className="flex items-center gap-1">
                      <p className="text-sm font-bold">{product.sellerName}</p>
                      <ShieldCheck className="h-3 w-3 text-blue-500" />
                   </div>
                   <p className="text-xs text-muted-foreground">Verified Student</p>
                </div>
             </div>
             <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs border-secondary-neon/30 text-secondary-neon hover:bg-secondary-neon/10"
                onClick={() => toast.info("Open tracking page to enable chat features.")}
             >
                <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Chat
             </Button>
          </div>

          {/* --- MEETING SPOT --- */}
          <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 p-4 rounded-xl">
             <div className="flex items-start gap-3">
                <div className="p-2 bg-background rounded-full shadow-sm shrink-0 text-blue-500">
                   <MapPin className="h-5 w-5" />
                </div>
                <div>
                   <h3 className="font-bold text-sm text-foreground">Meeting Spot</h3>
                   <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                     {product.location || "Main Canteen Entrance"}
                   </p>
                   <p className="text-[10px] text-blue-500/80 mt-2 font-medium flex items-center">
                     <ShieldCheck className="h-3 w-3 mr-1" /> Safe Exchange Zone Verified
                   </p>
                </div>
             </div>
          </div>

          {/* --- DESCRIPTION --- */}
          <div className="space-y-2">
            <h3 className="font-bold text-lg">About this item</h3>
            <p className="text-sm text-muted-foreground leading-7 whitespace-pre-wrap">
              {product.description || "No description provided."}
            </p>
          </div>

          {/* --- SAFETY INFO (Accordion) --- */}
          <Collapsible className="border border-border rounded-lg">
             <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-sm font-medium hover:bg-muted/50 transition-colors">
                <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500"/> Safety Guidelines</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
             </CollapsibleTrigger>
             <CollapsibleContent className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed">
                1. Always meet in public places like the Canteen or Library.<br/>
                2. Verify the item condition before payment.<br/>
                3. Use the in-app chat for coordination.<br/>
                4. Do not share personal financial details.
             </CollapsibleContent>
          </Collapsible>

          {/* --- REVIEWS --- */}
          <div className="space-y-4 pt-2">
            <h3 className="font-bold text-lg">Reviews ({reviews.length})</h3>
            {reviews.length === 0 ? (
               <div className="text-center py-8 border border-dashed border-border rounded-lg bg-muted/10">
                  <Star className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No reviews yet.</p>
               </div>
            ) : (
               <div className="grid gap-3">
                  {reviews.map((review) => (
                     <div key={review.$id} className="p-3 bg-card border border-border/40 rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-1">
                           <span className="font-bold text-xs">{review.reviewerName || "Student"}</span>
                           <div className="flex items-center gap-0.5 bg-yellow-500/10 px-1.5 py-0.5 rounded text-yellow-600 text-[10px] font-bold">
                              {review.rating} <Star className="h-3 w-3 fill-current" />
                           </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{review.comment}</p>
                     </div>
                  ))}
               </div>
            )}
          </div>
        </div>
      </div>

      {/* --- STICKY ACTION BAR --- */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur-md border-t border-border z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
         <div className="max-w-3xl mx-auto flex gap-3">
            {user?.$id !== product.userId ? (
                <>
                    {/* BARGAIN BUTTON */}
                    <Dialog open={isBargainDialogOpen} onOpenChange={setIsBargainDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex-1 h-12 border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10 font-bold">
                                <Gavel className="mr-2 h-4 w-4" /> Make Offer
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                                <DialogTitle>Negotiate Price</DialogTitle>
                                <DialogDescription>Enter your offer price. The seller will be notified.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                                <div className="space-y-2">
                                    <Label>Your Offer (₹)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-muted-foreground font-bold">₹</span>
                                        <Input 
                                            type="number" 
                                            className="pl-8 text-lg font-bold" 
                                            placeholder={product.price.replace(/\D/g, '')}
                                            value={bargainAmount}
                                            onChange={(e) => setBargainAmount(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded text-xs text-yellow-700 dark:text-yellow-400">
                                    If accepted, the price will update instantly for you to purchase.
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleBargain} disabled={!bargainAmount || isNegotiating} className="w-full bg-secondary-neon text-primary-foreground">
                                    {isNegotiating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Offer"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* BUY BUTTON */}
                    <Dialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex-[1.5] h-12 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 font-bold text-base shadow-lg shadow-secondary-neon/20">
                                <ShoppingCart className="mr-2 h-5 w-5" /> Buy Now
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader><DialogTitle>Secure Purchase</DialogTitle></DialogHeader>
                            <BuyProductDialog 
                                product={{...product, price: currentPrice}} // Pass the updated price!
                                onPurchaseInitiated={() => setIsBuyDialogOpen(false)} 
                                onCancel={() => setIsBuyDialogOpen(false)} 
                            />
                        </DialogContent>
                    </Dialog>
                </>
            ) : (
                <Button disabled className="w-full h-12 bg-muted text-muted-foreground font-bold">
                    This is your listing
                </Button>
            )}
         </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;