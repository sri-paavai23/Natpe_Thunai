"use client";

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Loader2, ArrowLeft, MessageCircle, Percent, 
  MapPin, ShieldCheck, Share2, AlertTriangle, 
  ShoppingCart, Heart, Handshake
} from "lucide-react";
import { toast } from "sonner";
import { 
  databases, 
  APPWRITE_DATABASE_ID, 
  APPWRITE_PRODUCTS_COLLECTION_ID,
  APPWRITE_TRANSACTIONS_COLLECTION_ID 
} from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { useAuth } from "@/context/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const ProductDetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Bargain State
  const [isBargainOpen, setIsBargainOpen] = useState(false);
  const [bargainStatus, setBargainStatus] = useState<'none' | 'pending' | 'accepted'>('none');

  // --- 1. FETCH PRODUCT ---
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!productId) return;
        const doc = await databases.getDocument(
          APPWRITE_DATABASE_ID, 
          APPWRITE_PRODUCTS_COLLECTION_ID, 
          productId
        );
        setProduct(doc);
        
        // Check bargain status if user is logged in
        if (user) {
            const bargains = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                'bargain_requests', // Assuming collection ID is literal or imported
                [
                    Query.equal('productId', productId),
                    Query.equal('buyerId', user.$id)
                ]
            );
            if(bargains.documents.length > 0) {
                setBargainStatus(bargains.documents[0].status);
            }
        }
      } catch (error) {
        toast.error("Product not found");
        navigate("/market");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId, user, navigate]);

  // --- 2. PAYMENT FLOW: CHAT FIRST ---
  const handleStartDeal = async () => {
    if (!user) {
      toast.error("Please login to buy items.");
      return;
    }
    if (user.$id === product.userId) {
      toast.error("You cannot buy your own item.");
      return;
    }

    setIsProcessing(true);
    try {
      // Check if a transaction already exists to avoid duplicates
      const existing = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        [
            Query.equal('productId', product.$id),
            Query.equal('buyerId', user.$id),
            Query.notEqual('status', 'completed') 
        ]
      );

      if (existing.documents.length > 0) {
        toast.info("Active chat found! Redirecting...");
        navigate("/tracking");
        return;
      }

      // Create Initial Transaction Record (Status: Negotiating)
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          productId: product.$id,
          productTitle: product.title,
          amount: parseFloat(product.price.replace(/[^0-9.]/g, '')), 
          buyerId: user.$id,
          buyerName: user.name,
          sellerId: product.userId,
          sellerName: product.sellerName,
          sellerUpiId: product.sellerUpiId || "default@upi",
          status: "negotiating", 
          type: product.type || "buy", 
          collegeName: product.collegeName,
          ambassadorDelivery: product.ambassadorDelivery,
          isBargain: bargainStatus === 'accepted'
        }
      );

      toast.success("Deal Started! Check Activity Log.");
      navigate("/tracking");

    } catch (error: any) {
      console.error(error);
      toast.error("Failed to start deal.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 3. BARGAIN LOGIC (Preserved) ---
  const handleMakeOffer = async () => {
    if (!user) return;
    setIsProcessing(true);
    try {
        const originalPrice = parseFloat(product.price.replace(/[^0-9.]/g, ''));
        const discountPrice = originalPrice * 0.85; // 15% rule

        await databases.createDocument(
            APPWRITE_DATABASE_ID,
            'bargain_requests',
            ID.unique(),
            {
                productId: product.$id,
                productTitle: product.title,
                buyerId: user.$id,
                buyerName: user.name,
                sellerId: product.userId,
                originalAmount: originalPrice,
                requestedAmount: discountPrice,
                status: 'pending',
                type: 'product'
            }
        );
        setBargainStatus('pending');
        toast.success("Offer sent to seller!");
        setIsBargainOpen(false);
    } catch (error) {
        toast.error("Failed to send offer.");
    } finally {
        setIsProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-neon" />
    </div>
  );

  if (!product) return null;

  // Visuals
  const isOwner = user?.$id === product.userId;
  const numericPrice = parseFloat(product.price.replace(/[^0-9.]/g, ''));
  const discountPrice = (numericPrice * 0.85).toFixed(0);

  return (
    <div className="min-h-screen bg-background text-foreground pb-32 relative">
      
      {/* HEADER IMAGE */}
      <div className="relative h-[40vh] w-full bg-muted">
        <img 
            src={product.imageUrl} 
            alt={product.title} 
            className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <Button 
            variant="secondary" 
            size="icon" 
            className="absolute top-4 left-4 rounded-full bg-background/50 backdrop-blur-md hover:bg-background z-10"
            onClick={() => navigate(-1)}
        >
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="absolute bottom-4 left-4 z-10">
            <Badge variant="secondary" className="bg-secondary-neon text-primary-foreground font-black uppercase tracking-widest mb-2">
                {product.type === 'rent' ? 'RENTAL' : 'FOR SALE'}
            </Badge>
            <h1 className="text-3xl font-black uppercase text-foreground leading-tight drop-shadow-md">{product.title}</h1>
        </div>
      </div>

      <div className="p-5 max-w-3xl mx-auto space-y-6">
        
        {/* PRICE & ACTIONS */}
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">Asking Price</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-secondary-neon">
                        {bargainStatus === 'accepted' ? `₹${discountPrice}` : product.price}
                    </span>
                    {bargainStatus === 'accepted' && (
                        <span className="text-sm text-muted-foreground line-through decoration-red-500">
                            {product.price}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="icon" className="rounded-full">
                    <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Heart className="h-4 w-4" />
                </Button>
            </div>
        </div>

        {/* SELLER INFO */}
        <Card className="border-border/60 bg-card/50">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${product.sellerName}`} />
                        <AvatarFallback>SL</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-bold">{product.sellerName}</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <MapPin className="h-3 w-3" /> {product.location || "Campus Area"}
                        </div>
                    </div>
                </div>
                <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/5">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                </Badge>
            </CardContent>
        </Card>

        {/* DETAILS */}
        <div className="space-y-4">
            <div>
                <h3 className="font-bold text-lg mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {product.description}
                </p>
            </div>

            {product.condition && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold">Condition</span>
                        <p className="text-sm font-semibold">{product.condition}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-xl border border-border/50">
                        <span className="text-[10px] uppercase text-muted-foreground font-bold">Damages</span>
                        <p className="text-sm font-semibold">{product.damages || "None"}</p>
                    </div>
                </div>
            )}
        </div>

        {/* SAFETY WARNING */}
        <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 flex gap-3 mb-20">
            <AlertTriangle className="h-5 w-5 text-blue-500 shrink-0" />
            <p className="text-xs text-blue-600 dark:text-blue-400 leading-snug">
                <strong>Safe Trade:</strong> Always chat within the app. Do not transfer money outside the Escrow system.
            </p>
        </div>

      </div>

      {/* FOOTER ACTIONS - Z-INDEX BOOSTED TO 50 */}
      <div className="fixed bottom-0 left-0 w-full bg-background/95 backdrop-blur-xl border-t-2 border-border p-4 pb-6 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
         <div className="max-w-3xl mx-auto flex gap-3 items-center">
            {isOwner ? (
                <Button className="w-full opacity-50 cursor-not-allowed font-bold" variant="secondary">Your Item</Button>
            ) : (
                <>
                    {/* BARGAIN BUTTON */}
                    {bargainStatus === 'none' && (
                        <Button 
                            variant="outline" 
                            className="flex-1 h-12 rounded-xl font-bold border-secondary-neon/50 text-secondary-neon hover:bg-secondary-neon/10 text-xs uppercase tracking-wider"
                            onClick={() => setIsBargainOpen(true)}
                        >
                            <Percent className="h-4 w-4 mr-2" /> Offer Price
                        </Button>
                    )}
                    
                    {/* START DEAL BUTTON */}
                    <Button 
                        onClick={handleStartDeal} 
                        disabled={isProcessing}
                        className="flex-[2] h-12 rounded-xl bg-secondary-neon text-primary-foreground font-black text-sm uppercase shadow-neon hover:scale-[1.02] transition-transform tracking-widest"
                    >
                        {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                            <span className="flex items-center gap-2">
                                <Handshake className="h-5 w-5" /> START DEAL
                            </span>
                        )}
                    </Button>
                </>
            )}
         </div>
      </div>

      {/* BARGAIN DIALOG */}
      <Dialog open={isBargainOpen} onOpenChange={setIsBargainOpen}>
        <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
                <DialogTitle>Make an Offer</DialogTitle>
                <DialogDescription>Request a 15% discount on this item.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Original Price</span>
                    <span className="line-through">₹{numericPrice}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                    <span>Your Offer</span>
                    <span className="text-green-500">₹{discountPrice}</span>
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsBargainOpen(false)}>Cancel</Button>
                <Button onClick={handleMakeOffer} disabled={isProcessing} className="bg-secondary-neon">
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Offer"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ProductDetailsPage;