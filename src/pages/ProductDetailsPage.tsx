"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ID, Query, Models } from 'appwrite'; // Import Models
import { Product } from "@/lib/mockData"; // Import Product interface
import { containsBlockedWords } from "@/lib/moderation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, MapPin, Star, DollarSign, MessageSquareText, Building2, Truck, Loader2, Flag } from 'lucide-react'; // Added Flag icon
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_PRODUCTS_COLLECTION_ID } from '@/lib/appwrite';
import { calculateCommissionRate } from '@/utils/commission'; // Import commission calculator
import { DEVELOPER_UPI_ID } from '@/lib/config'; // Import DEVELOPER_UPI_ID
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"; // Import Dialog components and DialogTrigger
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption"; // NEW: Import AmbassadorDeliveryOption
import ReportListingForm from "@/components/forms/ReportListingForm"; // NEW: Import ReportListingForm

export default function ProductDetailsPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmPurchaseDialogOpen, setIsConfirmPurchaseDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false); // NEW: State for report dialog
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false);
  const [ambassadorMessage, setAmbassadorMessage] = useState("");
  const [isBargainPurchase, setIsBargainPurchase] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError("Invalid product ID.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      
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
    
    // Optional: Add real-time subscription for this specific product if needed, 
    // but for details page, a single fetch is often sufficient unless status changes frequently.
    // We will skip the subscription here to keep it simple, relying on the user to refresh.

  }, [productId]);

  const handleOpenConfirmPurchase = (bargain: boolean) => {
    // Added explicit check for user.$id
    if (!user || !user.$id || !userProfile || !userProfile.collegeName) {
      toast.error("Please log in with a complete profile to proceed with a transaction.");
      navigate("/auth");
      return;
    }
    if (!product) return;

    if (user.$id === product.sellerId) {
      toast.error("You cannot buy/rent your own listing.");
      return;
    }

    setIsBargainPurchase(bargain);
    setIsConfirmPurchaseDialogOpen(true);
  };

  const handleInitiatePayment = async () => {
    // Added explicit check for user.$id
    if (!user || !user.$id || !userProfile || !product) {
      toast.error("User session expired or profile incomplete. Please log in again and ensure your profile is complete.");
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    
    // 1. Calculate Price
    const priceString = product.price.replace(/[₹,]/g, '').split('/')[0].trim();
    let amount = parseFloat(priceString);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid product price.");
      setIsProcessing(false);
      return;
    }

    const transactionType = product.type === 'sell' ? 'buy' : 'rent';
    const discountRate = 0.15; // 15% fixed bargain discount
    
    if (isBargainPurchase) {
      amount = amount * (1 - discountRate);
    }

    const transactionAmount = parseFloat(amount.toFixed(2));
    const transactionNote = isBargainPurchase 
      ? `Bargain purchase of ${product.title}` 
      : `${transactionType} of ${product.title}`;

    try {
      // 2. Create Appwrite Transaction Document (Status: initiated)
      const newTransaction = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          productId: product.$id,
          productTitle: product.title,
          buyerId: user.$id,
          buyerName: user.name,
          sellerId: product.sellerId,
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

      // NEW: Increment ambassador deliveries count if opted
      if (ambassadorDelivery) {
        await incrementAmbassadorDeliveriesCount();
      }

      // 3. Generate UPI Deep Link (Payment goes to Developer UPI ID)
      const upiDeepLink = `upi://pay?pa=${DEVELOPER_UPI_ID}&pn=NatpeThunaiDevelopers&am=${transactionAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote + ` (TX ID: ${transactionId})`)}`;

      // 4. Redirect to UPI App
      window.open(upiDeepLink, "_blank");
      
      toast.info(`Redirecting to UPI app to pay ₹${transactionAmount.toFixed(2)} to the developer. Please complete the payment and note the UTR ID.`);

      // 5. Redirect to Confirmation Page
      navigate(`/market/confirm-payment/${transactionId}`);

    } catch (error: any) {
      console.error("Error initiating transaction:", error);
      toast.error(error.message || "Failed to initiate transaction.");
    } finally {
      setIsProcessing(false);
      setIsConfirmPurchaseDialogOpen(false); // Close dialog
    }
  };

  const handleBargainRequest = () => {
    // Added explicit check for user.$id
    if (!user || !user.$id || !userProfile || !product) {
      toast.error("Please log in with a complete profile to send a bargain request.");
      navigate("/auth");
      return;
    }
    if (user.$id === product.sellerId) {
      toast.error("You cannot bargain on your own listing.");
      return;
    }

    const priceString = product.price.replace(/[₹,]/g, '').split('/')[0].trim();
    const originalAmount = parseFloat(priceString);
    if (isNaN(originalAmount) || originalAmount <= 0) {
      toast.error("Invalid product price for bargaining.");
      return;
    }

    const discountRate = 0.15;
    const bargainAmount = originalAmount * (1 - discountRate);

    // Simulate sending a message to the seller
    toast.success(`Bargain request sent to ${product.sellerName}!`);
    toast.info(`You requested a 15% discount, making the price ₹${bargainAmount.toFixed(2)}. ${product.sellerName} will respond soon.`);
    console.log(`Bargain Request: User ${user.name} requested 15% off (${bargainAmount.toFixed(2)}) for product ${product.title}. Seller UPI: ${product.sellerUpiId}`);
  };

  if (isLoading) {
    return <div className="p-6 text-center text-foreground">Loading product details...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!product) return null;

  const isModerated = containsBlockedWords(product.description) || containsBlockedWords(product.title);
  const isBuyOrRent = product.type === 'sell' || product.type === 'rent';
  const actionText = product.type === 'sell' ? 'Buy Now' : 'Rent Now';
  const originalPrice = product.price.replace(/[₹,]/g, '').split('/')[0].trim();
  const bargainPrice = (parseFloat(originalPrice) * 0.85).toFixed(2); // 15% discount
  const currentPurchasePrice = isBargainPurchase ? parseFloat(bargainPrice) : parseFloat(originalPrice);


  return (
    <div className="container mx-auto p-6 pb-20">
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Image Section */}
        <div>
          <img 
            src={product.imageUrl || "/app-logo.png"} 
            alt={product.title} 
            className="w-full h-auto object-cover rounded-lg shadow-lg max-h-[400px]"
          />
        </div>

        {/* Details Section */}
        <div>
          <h1 className="text-4xl font-bold mb-2 text-foreground">{product.title}</h1>
          <p className="text-3xl font-semibold text-secondary-neon mb-4">{product.price}</p>

          <div className="flex items-center space-x-2 mb-4">
            <Badge variant="secondary" className="bg-primary-blue-light text-primary-foreground">{product.type.toUpperCase()}</Badge>
            <div className="flex items-center text-secondary-neon">
              <Star className="h-4 w-4 mr-1 fill-secondary-neon" />
              <span>{product.sellerRating}</span>
            </div>
            {product.sellerBadge && <Badge variant="default" className="bg-accent text-accent-foreground">{product.sellerBadge}</Badge>}
          </div>

          <p className="text-muted-foreground mb-6">{product.description}</p>

          {isBuyOrRent && (
            <div className="space-y-4">
              <Button 
                size="lg" 
                className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
                onClick={() => handleOpenConfirmPurchase(false)} // Open dialog for direct purchase
                disabled={isProcessing}
              >
                <DollarSign className="mr-2 h-5 w-5" /> 
                {isProcessing ? "Processing..." : actionText}
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full border-primary text-primary hover:bg-primary/10"
                onClick={() => handleOpenConfirmPurchase(true)} // Open dialog for bargain purchase
                disabled={isProcessing}
              >
                <MessageSquareText className="mr-2 h-5 w-5" /> 
                Bargain (15% off: ₹{bargainPrice})
              </Button>
            </div>
          )}
          
          {!isBuyOrRent && (
            <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Contact Seller
            </Button>
          )}

          <Card className="mt-6 bg-card border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-lg text-foreground">Seller Information</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="font-medium text-foreground">{product.sellerName}</p>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span>Located in {product.location}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Building2 className="h-4 w-4 mr-1" /> {/* NEW: College icon */}
                <span>College: {product.collegeName}</span> {/* NEW: Display collegeName */}
              </div>
            </CardContent>
          </Card>

          {product.damages && (
            <Alert variant="destructive" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Condition Note</AlertTitle>
              <AlertDescription>
                {product.damages}
              </AlertDescription>
            </Alert>
          )}

          {isModerated && (
            <Alert variant="warning" className="mt-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Under Review</AlertTitle>
              <AlertDescription>
                This listing may contain sensitive content and is currently under review by moderators.
              </AlertDescription>
            </Alert>
          )}

          {/* NEW: Report Listing Button */}
          <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full mt-6 border-destructive text-destructive hover:bg-destructive/10">
                <Flag className="mr-2 h-4 w-4" /> Report Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Report Listing: {product.title}</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Help us keep Natpe🤝Thunai safe by reporting inappropriate content.
                </DialogDescription>
              </DialogHeader>
              <ReportListingForm
                productId={product.$id}
                productTitle={product.title}
                sellerId={product.sellerId}
                onReportSubmitted={() => setIsReportDialogOpen(false)}
                onCancel={() => setIsReportDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Confirmation Dialog for Purchase/Rent */}
      <Dialog open={isConfirmPurchaseDialogOpen} onOpenChange={setIsConfirmPurchaseDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-secondary-neon" /> Confirm {product.type === 'sell' ? 'Purchase' : 'Rent'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Review your order and select delivery options before proceeding to payment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-foreground">Item: <span className="font-semibold">{product.title}</span></p>
            <p className="text-xl font-bold text-secondary-neon">
              Price: ₹{currentPurchasePrice.toFixed(2)} {product.type === 'rent' ? '/day' : ''}
            </p>
            {isBargainPurchase && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                <Badge variant="outline" className="bg-green-100 text-green-800">15% Bargain Applied</Badge>
              </p>
            )}
            <p className="text-xs text-muted-foreground">Seller: {product.sellerName}</p>
            <p className="text-xs text-destructive-foreground">
                Payment will be made to Natpe Thunai Developers, who will then transfer the net amount to the seller.
            </p>
          </div>

          <AmbassadorDeliveryOption
            ambassadorDelivery={ambassadorDelivery}
            setAmbassadorDelivery={setAmbassadorDelivery}
            ambassadorMessage={ambassadorMessage}
            setAmbassadorMessage={setAmbassadorMessage}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmPurchaseDialogOpen(false)} disabled={isProcessing} className="border-border text-primary-foreground hover:bg-muted">
              Cancel
            </Button>
            <Button onClick={handleInitiatePayment} disabled={isProcessing} className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Proceed to Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}