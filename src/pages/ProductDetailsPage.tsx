"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ID } from 'appwrite';
import { Product } from "@/lib/mockData";
import { containsBlockedWords } from "@/lib/moderation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, MapPin, Star, DollarSign, MessageSquareText, Building2, Loader2, Flag, Award } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_PRODUCTS_COLLECTION_ID } from '@/lib/appwrite';
import { DEVELOPER_UPI_ID } from '@/lib/config';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption";
import ReportListingForm from "@/components/forms/ReportListingForm";
import { useBargainRequests } from '@/hooks/useBargainRequests';
import { getLevelBadge } from "@/utils/badges";

export default function ProductDetailsPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth();
  const { sendBargainRequest, getBargainStatusForProduct } = useBargainRequests();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmPurchaseDialogOpen, setIsConfirmPurchaseDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false);
  const [ambassadorMessage, setAmbassadorMessage] = useState("");
  const [isBargainPurchase, setIsBargainPurchase] = useState(false);

  // Get current bargain status (Real-time updated via the hook)
  const { status: currentBargainStatus } = getBargainStatusForProduct(productId || '');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError("Invalid product ID.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const doc = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_PRODUCTS_COLLECTION_ID,
          productId
        ) as unknown as Product;
        setProduct(doc);
      } catch (err: any) {
        console.error("Error fetching product:", err);
        setError("Product not found or failed to load.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleOpenConfirmPurchase = (bargain: boolean) => {
    if (!user || !userProfile) {
      toast.error("Please log in to proceed.");
      navigate("/auth");
      return;
    }
    if (!product) return;
    if (user.$id === product.userId) {
      toast.error("You cannot buy your own listing.");
      return;
    }
    
    // Set the state so the payment function knows which price to use
    setIsBargainPurchase(bargain);
    setIsConfirmPurchaseDialogOpen(true);
  };

  const handleInitiatePayment = async () => {
    if (!user || !userProfile || !product) return;
    setIsProcessing(true);
    
    const priceString = product.price.replace(/[₹,]/g, '').split('/')[0].trim();
    let amount = parseFloat(priceString);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid product price.");
      setIsProcessing(false);
      return;
    }

    const transactionType = product.type === 'sell' ? 'buy' : 'rent';
    const discountRate = 0.15; 
    
    // Apply discount if this is a bargain purchase
    if (isBargainPurchase) {
      amount = amount * (1 - discountRate);
    }

    const transactionAmount = parseFloat(amount.toFixed(2));
    const transactionNote = isBargainPurchase 
      ? `Bargain purchase of ${product.title}` 
      : `${transactionType} of ${product.title}`;

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
          amount: transactionAmount,
          status: "initiated",
          type: transactionType,
          isBargain: isBargainPurchase,
          collegeName: userProfile.collegeName,
          ambassadorDelivery: ambassadorDelivery,
          ambassadorMessage: ambassadorMessage || null,
        }
      );

      const transactionId = newTransaction.$id;
      if (ambassadorDelivery) {
        await incrementAmbassadorDeliveriesCount();
      }

      const upiDeepLink = `upi://pay?pa=${DEVELOPER_UPI_ID}&pn=NatpeThunaiDevelopers&am=${transactionAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote + ` (TX ID: ${transactionId})`)}`;
      window.open(upiDeepLink, "_blank");
      navigate(`/market/confirm-payment/${transactionId}`);

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to initiate transaction.");
    } finally {
      setIsProcessing(false);
      setIsConfirmPurchaseDialogOpen(false);
    }
  };

  const handleSendBargainRequest = async () => {
    if (!user || !userProfile || !product) {
        toast.error("Please log in."); 
        return;
    }
    if (user.$id === product.userId) {
        toast.error("Cannot bargain on own item.");
        return;
    }
    
    // Status checks
    if (currentBargainStatus === 'pending') {
      toast.info("Request pending."); return;
    }
    if (currentBargainStatus === 'denied') {
      toast.info("Request denied."); return;
    }
    if (currentBargainStatus === 'accepted') {
      toast.success("Bargain already accepted! Click 'Buy Now' to purchase at discounted price."); return;
    }

    const originalAmount = parseFloat(product.price.replace(/[₹,]/g, '').split('/')[0].trim());
    const requestedBargainAmount = originalAmount * (1 - 0.15);

    try {
      await sendBargainRequest(product, requestedBargainAmount);
    } catch (error) {
      // Error handled in hook
    }
  };

  if (isLoading) return <div className="p-6 text-center">Loading...</div>;
  if (error || !product) return <div className="p-6 text-destructive">{error || "Product not found"}</div>;

  const isModerated = containsBlockedWords(product.description) || containsBlockedWords(product.title);
  const isBuyOrRent = product.type === 'sell' || product.type === 'rent';
  const actionText = product.type === 'sell' ? 'Buy Now' : 'Rent Now';
  
  // Price Calculations
  const originalPriceVal = parseFloat(product.price.replace(/[₹,]/g, '').split('/')[0].trim());
  const bargainPriceVal = (originalPriceVal * 0.85).toFixed(2);
  
  // Logic: Is the bargain accepted?
  const isBargainAccepted = currentBargainStatus === 'accepted';
  
  // Determine displayed price for the confirm dialog
  const currentPurchasePrice = (isBargainPurchase || isBargainAccepted) ? parseFloat(bargainPriceVal) : originalPriceVal;
  
  const sellerBadge = product.sellerLevel ? getLevelBadge(product.sellerLevel) : undefined;

  return (
    <div className="container mx-auto p-6 pb-20">
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div>
          <img src={product.imageUrl || "/app-logo.png"} alt={product.title} className="w-full h-auto object-cover rounded-lg shadow-lg max-h-[400px]" />
        </div>

        <div>
          <h1 className="text-4xl font-bold mb-2 text-foreground">{product.title}</h1>
          
          {/* UPDATED PRICE DISPLAY LOGIC */}
          <div className="mb-4">
            {isBargainAccepted ? (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xl text-muted-foreground line-through decoration-destructive">
                            {product.price}
                        </span>
                        <span className="text-3xl font-bold text-green-500 animate-pulse">
                            ₹{bargainPriceVal}
                        </span>
                    </div>
                    <Badge variant="outline" className="w-fit border-green-500 text-green-600 bg-green-50">
                        Bargain Accepted (-15%)
                    </Badge>
                </div>
            ) : (
                <p className="text-3xl font-semibold text-secondary-neon">{product.price}</p>
            )}
          </div>

          <div className="flex items-center space-x-2 mb-4">
            <Badge variant="secondary" className="bg-primary-blue-light text-primary-foreground">{product.type.toUpperCase()}</Badge>
            <div className="flex items-center text-secondary-neon">
              <Star className="h-4 w-4 mr-1 fill-secondary-neon" />
              <span>{product.sellerRating}</span>
            </div>
            {sellerBadge && <Badge className="bg-blue-500 text-white flex items-center gap-1"><Award className="h-3 w-3" /> {sellerBadge}</Badge>}
          </div>

          <p className="text-muted-foreground mb-6">{product.description}</p>

          {isBuyOrRent && (
            <div className="space-y-4">
              <Button 
                size="lg" 
                className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
                // FIX: Pass true if bargain is accepted
                onClick={() => handleOpenConfirmPurchase(isBargainAccepted)} 
                disabled={isProcessing || product.status !== 'available'}
              >
                <DollarSign className="mr-2 h-5 w-5" /> 
                {isProcessing ? "Processing..." : (product.status !== 'available' ? "Not Available" : (isBargainAccepted ? `Buy at ₹${bargainPriceVal}` : actionText))}
              </Button>
              
              {!isBargainAccepted && (
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full border-primary text-primary hover:bg-primary/10"
                    onClick={handleSendBargainRequest} 
                    disabled={isProcessing || currentBargainStatus === 'pending' || currentBargainStatus === 'denied' || product.status !== 'available' || user?.$id === product.userId}
                  >
                    <MessageSquareText className="mr-2 h-5 w-5" /> 
                    {currentBargainStatus === 'pending' ? 'Bargain Pending...' : 
                     currentBargainStatus === 'denied' ? 'Bargain Denied' : 
                     `Bargain (15% off: ₹${bargainPriceVal})`}
                  </Button>
              )}
            </div>
          )}
          
          {/* ... (Rest of the component: Seller Info, Reports, etc. remains same) */}
          {/* Omitted for brevity, include existing Card, Alerts, Dialogs here */}
          
          {/* NEW: Report Listing Button & Dialogs need to remain here */}
           <div className="mt-6">
                {/* ... existing Seller Card ... */}
                {/* ... existing Report Dialog ... */}
           </div>
        </div>
      </div>

      <Dialog open={isConfirmPurchaseDialogOpen} onOpenChange={setIsConfirmPurchaseDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-secondary-neon" /> Confirm Payment
            </DialogTitle>
            <DialogDescription>Non-Escrow Payment</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-foreground">Item: <span className="font-semibold">{product.title}</span></p>
            <p className="text-xl font-bold text-secondary-neon">
              Price: ₹{currentPurchasePrice.toFixed(2)}
            </p>
            {/* Show badge in dialog if bargain is active */}
            {(isBargainPurchase || isBargainAccepted) && (
              <Badge variant="outline" className="bg-green-100 text-green-800">15% Bargain Applied</Badge>
            )}
          </div>
          
          <AmbassadorDeliveryOption
            ambassadorDelivery={ambassadorDelivery}
            setAmbassadorDelivery={setAmbassadorDelivery}
            ambassadorMessage={ambassadorMessage}
            setAmbassadorMessage={setAmbassadorMessage}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmPurchaseDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleInitiatePayment} disabled={isProcessing} className="bg-secondary-neon text-primary-foreground">
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Proceed to Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}