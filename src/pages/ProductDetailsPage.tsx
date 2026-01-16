"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID, APPWRITE_SERVICE_REVIEWS_COLLECTION_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from "@/lib/appwrite";
import { Query, ID } from "appwrite";
import { DEVELOPER_UPI_ID } from '@/lib/config';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Loader2, ArrowLeft, MapPin, Star, ShieldCheck, 
  ShoppingCart, MessageCircle, AlertTriangle, ChevronDown, Gavel, DollarSign, Image as ImageIcon
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption";
import { useBargainRequests } from '@/hooks/useBargainRequests';
import BuyProductDialog from "@/components/forms/BuyProductDialog";

// Helper for Drive Links
const getOptimizedImageUrl = (url?: string) => {
  if (!url) return null;
  if (url.includes("drive.google.com") && url.includes("/view")) {
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
    }
  }
  return url;
};

const ProductDetailsPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth();
  
  const { sendBargainRequest, getBargainStatusForProduct } = useBargainRequests();
  const { status: currentBargainStatus } = getBargainStatusForProduct(productId || '');

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Image State
  const [displayImage, setDisplayImage] = useState<string>("");
  const [hasImageError, setHasImageError] = useState(false);

  // Transaction State
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false);
  const [isBargainDialogOpen, setIsBargainDialogOpen] = useState(false);
  const [bargainAmount, setBargainAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false);
  const [ambassadorMessage, setAmbassadorMessage] = useState("");

  const originalPriceVal = product ? parseFloat(product.price.replace(/[₹,]/g, '').split('/')[0].trim()) : 0;
  const isBargainAccepted = currentBargainStatus === 'accepted';
  const finalPrice = isBargainAccepted ? (originalPriceVal * 0.85) : originalPriceVal;

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
        
        // Handle Initial Image State
        const optimizedUrl = getOptimizedImageUrl(productDoc.imageUrl);
        if (optimizedUrl && optimizedUrl.trim() !== "") {
            setDisplayImage(optimizedUrl);
            setHasImageError(false);
        } else {
            setHasImageError(true);
            setDisplayImage("/app-logo.png"); // Fallback
        }

        const reviewsRes = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_SERVICE_REVIEWS_COLLECTION_ID,
          [Query.equal("serviceId", productId), Query.orderDesc("$createdAt")]
        );
        setReviews(reviewsRes.documents);

      } catch (error) {
        console.error("Error:", error);
        toast.error("Product not found.");
        navigate("/market");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, navigate]);

  const handleSendBargainRequest = async () => {
    if (!user || !product || !bargainAmount) return;
    setIsProcessing(true);
    try {
        await sendBargainRequest(product, parseFloat(bargainAmount));
        setIsBargainDialogOpen(false);
        toast.success("Offer Sent!");
    } catch (error: any) {
        toast.error(error.message || "Failed to send offer.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleInitiatePayment = async () => {
    if (!user || !userProfile || !product) return;
    setIsProcessing(true);

    const transactionType = product.type === 'sell' ? 'buy' : 'rent';
    const transactionNote = isBargainAccepted 
      ? `Bargain buy: ${product.title}` 
      : `${transactionType}: ${product.title}`;

    try {
      const newTransaction = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          productId: product.$id,
          productTitle: product.title,
          buyerId: user.$id,
          buyerName: user.name,
          sellerId: product.userId,
          sellerName: product.sellerName,
          sellerUpiId: product.sellerUpiId, 
          amount: parseFloat(finalPrice.toFixed(2)),
          status: "initiated",
          type: transactionType,
          isBargain: isBargainAccepted,
          collegeName: userProfile.collegeName,
          ambassadorDelivery: ambassadorDelivery,
          ambassadorMessage: ambassadorMessage || null,
        }
      );

      const transactionId = newTransaction.$id;
      if (ambassadorDelivery && incrementAmbassadorDeliveriesCount) {
        await incrementAmbassadorDeliveriesCount();
      }

      const upiDeepLink = `upi://pay?pa=${DEVELOPER_UPI_ID}&pn=NatpeThunai&am=${finalPrice.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote + ` (TX:${transactionId.substring(0,6)})`)}`;
      window.open(upiDeepLink, "_blank");
      
      setIsBuyDialogOpen(false);
      navigate(`/market/confirm-payment/${transactionId}`);

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to initiate transaction.");
    } finally {
      setIsProcessing(false);
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
    <div className="min-h-screen bg-background pb-28 relative">
      
      {/* HEADER */}
      <div className="sticky top-0 z-20 flex items-center p-3 bg-background/80 backdrop-blur-xl border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <span className="font-semibold text-sm ml-2 truncate">Product Details</span>
      </div>

      <div className="max-w-3xl mx-auto">
        
        {/* PRODUCT IMAGE CONTAINER */}
        <div className="w-full aspect-square sm:aspect-video bg-muted/30 relative overflow-hidden group flex items-center justify-center bg-secondary/5">
          <img 
            src={displayImage}
            alt={product.title}
            className={`w-full h-full transition-opacity duration-500 ${
                // If error, contain the logo nicely. If success, cover the area.
                hasImageError ? 'object-contain p-12 opacity-90' : 'object-contain'
            }`}
            onError={() => { 
                setHasImageError(true);
                setDisplayImage("/app-logo.png"); // Fallback to Logo
            }}
          />

          <div className="absolute top-4 left-4 z-10">
             <Badge className="bg-background/90 text-foreground backdrop-blur border border-border/50 shadow-sm uppercase tracking-wider text-[10px]">
                {product.type}
             </Badge>
          </div>
        </div>

        {/* MAIN INFO */}
        <div className="p-5 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground leading-tight">{product.title}</h1>
            <div className="flex items-center gap-2">
               {isBargainAccepted ? (
                   <>
                     <span className="text-3xl font-black text-green-500">₹{finalPrice.toFixed(2)}</span>
                     <span className="text-sm text-muted-foreground line-through">₹{originalPriceVal}</span>
                     <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Deal Accepted</Badge>
                   </>
               ) : (
                   <p className="text-3xl font-black text-secondary-neon">{product.price}</p>
               )}
            </div>
            {product.condition && (
               <Badge variant="secondary" className="mt-2 text-xs font-medium">
                 Condition: {product.condition}
               </Badge>
            )}
          </div>

          <Separator />

          {/* SELLER CARD */}
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
             <Button variant="outline" size="sm" onClick={() => toast.info("Opening Chat...")} className="h-8 text-xs border-secondary-neon/30 text-secondary-neon hover:bg-secondary-neon/10">
                <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Chat
             </Button>
          </div>

          {/* MEETING SPOT */}
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

          {/* DESCRIPTION */}
          <div className="space-y-2">
            <h3 className="font-bold text-lg">About this item</h3>
            <p className="text-sm text-muted-foreground leading-7 whitespace-pre-wrap">
              {product.description || "No description provided."}
            </p>
          </div>

          {/* SAFETY */}
          <Collapsible className="border border-border rounded-lg">
             <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-sm font-medium hover:bg-muted/50 transition-colors">
                <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500"/> Safety Guidelines</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
             </CollapsibleTrigger>
             <CollapsibleContent className="p-4 pt-0 text-xs text-muted-foreground leading-relaxed">
                1. Always meet in public places like the Canteen or Library.<br/>
                2. Verify the item condition before payment.<br/>
                3. Use the in-app chat for coordination.
             </CollapsibleContent>
          </Collapsible>

          {/* REVIEWS */}
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

      {/* STICKY ACTION BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/95 backdrop-blur-md border-t border-border z-30 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
         <div className="max-w-3xl mx-auto flex gap-3">
            {user?.$id !== product.userId ? (
                <>
                    {/* BARGAIN DIALOG */}
                    {!isBargainAccepted && (
                      <Dialog open={isBargainDialogOpen} onOpenChange={setIsBargainDialogOpen}>
                          <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                className="flex-1 h-12 border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10 font-bold"
                                disabled={currentBargainStatus === 'pending' || currentBargainStatus === 'denied'}
                              >
                                  <Gavel className="mr-2 h-4 w-4" /> 
                                  {currentBargainStatus === 'pending' ? 'Pending' : currentBargainStatus === 'denied' ? 'Denied' : 'Make Offer'}
                              </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[400px]">
                              <DialogHeader>
                                  <DialogTitle>Negotiate Price</DialogTitle>
                                  <DialogDescription>Enter your offer. 15% discount limit usually applies.</DialogDescription>
                              </DialogHeader>
                              <div className="py-4 space-y-4">
                                  <div className="space-y-2">
                                      <Label>Your Offer (₹)</Label>
                                      <div className="relative">
                                          <span className="absolute left-3 top-3 text-muted-foreground font-bold">₹</span>
                                          <Input 
                                              type="number" 
                                              className="pl-8 text-lg font-bold" 
                                              placeholder={(originalPriceVal * 0.85).toFixed(0)}
                                              value={bargainAmount}
                                              onChange={(e) => setBargainAmount(e.target.value)}
                                          />
                                      </div>
                                  </div>
                              </div>
                              <DialogFooter>
                                  <Button onClick={handleSendBargainRequest} disabled={!bargainAmount || isProcessing} className="w-full bg-secondary-neon text-primary-foreground">
                                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Offer"}
                                  </Button>
                              </DialogFooter>
                          </DialogContent>
                      </Dialog>
                    )}

                    {/* BUY DIALOG */}
                    <Dialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex-[1.5] h-12 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 font-bold text-base shadow-lg shadow-secondary-neon/20">
                                <ShoppingCart className="mr-2 h-5 w-5" /> {isBargainAccepted ? `Buy @ ₹${finalPrice}` : 'Buy Now'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-secondary-neon" /> Confirm Purchase
                                </DialogTitle>
                                <DialogDescription>Review details before payment.</DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4 py-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Price:</span>
                                    <span className="font-bold text-lg">₹{finalPrice.toFixed(2)}</span>
                                </div>
                                <AmbassadorDeliveryOption 
                                    ambassadorDelivery={ambassadorDelivery}
                                    setAmbassadorDelivery={setAmbassadorDelivery}
                                    ambassadorMessage={ambassadorMessage}
                                    setAmbassadorMessage={setAmbassadorMessage}
                                />
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsBuyDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleInitiatePayment} disabled={isProcessing} className="bg-secondary-neon text-primary-foreground">
                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pay Now"}
                                </Button>
                            </DialogFooter>
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