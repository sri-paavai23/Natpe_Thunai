"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID, APPWRITE_SERVICE_REVIEWS_COLLECTION_ID } from "@/lib/appwrite";
import { Query } from "appwrite";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Loader2, ArrowLeft, MapPin, Share2, Star, ShieldCheck, Heart, ShoppingCart, MessageCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import BuyProductDialog from "@/components/forms/BuyProductDialog";

const ProductDetailsPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!productId) return;
      try {
        // 1. Fetch Product Details
        const productDoc = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_PRODUCTS_COLLECTION_ID,
          productId
        );
        setProduct(productDoc);

        // 2. Fetch Reviews (using service_reviews collection filtered by productId)
        // Assuming your review schema links via 'serviceId' or 'productId'
        const reviewsRes = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_SERVICE_REVIEWS_COLLECTION_ID,
          [Query.equal("serviceId", productId), Query.orderDesc("$createdAt")]
        );
        setReviews(reviewsRes.documents);

      } catch (error) {
        console.error("Error fetching details:", error);
        toast.error("Product not found or removed.");
        navigate("/market");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, navigate]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.title,
        text: `Check out this deal on Natpe Thunai: ${product?.title}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
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
    <div className="min-h-screen bg-background pb-24">
      {/* --- HEADER --- */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-background/80 backdrop-blur-md border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Heart className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        
        {/* --- PRODUCT IMAGE --- */}
        <div className="w-full h-80 sm:h-96 bg-muted relative overflow-hidden">
          <img 
            src={product.imageUrl ? product.imageUrl : "/icons/icon-512x512.png"} 
            alt={product.title}
            className="w-full h-full object-contain bg-black/5"
            onError={(e) => { (e.target as HTMLImageElement).src = '/icons/icon-512x512.png'; }}
          />
          {product.type === 'gift' && (
             <div className="absolute bottom-4 left-4 bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse">
                FREE GIFT 🎁
             </div>
          )}
        </div>

        {/* --- PRODUCT INFO --- */}
        <div className="p-4 space-y-4">
          <div>
            <div className="flex justify-between items-start">
               <h1 className="text-2xl font-bold text-foreground leading-tight">{product.title}</h1>
               <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-secondary-neon">{product.price}</span>
                  <Badge variant="outline" className="text-[10px] uppercase">{product.type}</Badge>
               </div>
            </div>
            
            {product.condition && (
               <p className="text-sm text-muted-foreground mt-1">
                 Condition: <span className="font-semibold text-foreground">{product.condition}</span>
               </p>
            )}
          </div>

          <Separator className="bg-border/60" />

          {/* --- MEETING SPOT (Important) --- */}
          <Card className="bg-secondary/5 border-secondary-neon/20 shadow-sm">
            <CardContent className="p-3 flex items-start gap-3">
               <div className="p-2 bg-secondary-neon/10 rounded-full shrink-0">
                  <MapPin className="h-5 w-5 text-secondary-neon" />
               </div>
               <div>
                  <h3 className="font-bold text-sm">Meeting Spot</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {product.location || "Contact seller for location"}
                  </p>
                  <p className="text-[10px] text-blue-400 mt-1 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Meet in public campus areas only.
                  </p>
               </div>
            </CardContent>
          </Card>

          {/* --- DESCRIPTION --- */}
          <div>
            <h3 className="font-bold text-lg mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          <Separator className="bg-border/60" />

          {/* --- SELLER INFO --- */}
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-secondary-neon/30">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${product.sellerName}`} />
                  <AvatarFallback>S</AvatarFallback>
                </Avatar>
                <div>
                   <p className="text-sm font-bold">{product.sellerName}</p>
                   <p className="text-xs text-muted-foreground">Seller</p>
                </div>
             </div>
             <Button variant="outline" size="sm" onClick={() => toast.info("Opening Chat...")}>
                <MessageCircle className="mr-2 h-4 w-4" /> Chat
             </Button>
          </div>

          <Separator className="bg-border/60" />

          {/* --- REVIEWS SECTION --- */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
               Ratings & Reviews <span className="text-xs font-normal text-muted-foreground">({reviews.length})</span>
            </h3>
            
            {reviews.length === 0 ? (
               <div className="text-center py-6 bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">No reviews yet. Be the first!</p>
               </div>
            ) : (
               <div className="space-y-3">
                  {reviews.map((review) => (
                     <div key={review.$id} className="p-3 bg-card border border-border/50 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                           <span className="font-bold text-sm">{review.reviewerName || "Student"}</span>
                           <div className="flex items-center gap-0.5">
                              <span className="text-sm font-bold">{review.rating}</span>
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
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

      {/* --- STICKY BOTTOM ACTION BAR (Mobile E-com Style) --- */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t border-border z-20 flex gap-3 max-w-md mx-auto sm:max-w-full sm:px-8">
         <div className="flex-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Price</p>
            <p className="text-xl font-black text-foreground">{product.price}</p>
         </div>
         
         {product.type !== 'gift' && user?.$id !== product.userId && (
            <Dialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen}>
               <DialogTrigger asChild>
                  <Button className="flex-1 h-12 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 font-bold text-base shadow-[0_0_15px_rgba(0,243,255,0.3)]">
                     <ShoppingCart className="mr-2 h-5 w-5" /> Buy Now
                  </Button>
               </DialogTrigger>
               <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader><DialogTitle>Secure Purchase</DialogTitle></DialogHeader>
                  <BuyProductDialog 
                     product={product} 
                     onPurchaseInitiated={() => setIsBuyDialogOpen(false)} 
                     onCancel={() => setIsBuyDialogOpen(false)} 
                  />
               </DialogContent>
            </Dialog>
         )}
         
         {user?.$id === product.userId && (
            <Button disabled className="flex-1 h-12 bg-muted text-muted-foreground">
               Your Listing
            </Button>
         )}
      </div>
    </div>
  );
};

export default ProductDetailsPage;