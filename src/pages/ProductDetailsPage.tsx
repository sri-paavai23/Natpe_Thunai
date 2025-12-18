"use client";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShoppingCart, Truck, ExternalLink, Handshake, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_MARKETPLACE_COLLECTION_ID } from "@/lib/appwrite";
import { Models, Query } from "appwrite";
import { useAuth } from "@/context/AuthContext";
import { MarketListing } from "@/hooks/useMarketListings";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import BuyProductDialog from "@/components/forms/BuyProductDialog"; // Assuming this component exists
import { useBargainRequests, BargainRequest } from "@/hooks/useBargainRequests"; // Import BargainRequest

const ProductDetailsPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user, userProfile, incrementAmbassadorDeliveriesCount } = useAuth();
  const { bargainRequests, isLoading: isBargainLoading, error: bargainError, refetchBargainRequests, updateBargainRequestStatus } = useBargainRequests();

  const [product, setProduct] = useState<MarketListing | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false);

  const userBargainRequest = bargainRequests.find(req => req.serviceId === productId && req.buyerId === user?.$id);
  const sellerBargainRequests = bargainRequests.filter(req => req.serviceId === productId && req.sellerId === user?.$id && req.status === "pending");

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setError("Product ID is missing.");
        setIsLoadingProduct(false);
        return;
      }
      setIsLoadingProduct(true);
      try {
        const response = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_MARKETPLACE_COLLECTION_ID,
          productId
        );
        setProduct(response as unknown as MarketListing);
      } catch (err: any) {
        console.error("Error fetching product:", err);
        setError(err.message || "Failed to fetch product details.");
      } finally {
        setIsLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleBuyClick = () => {
    if (!user) {
      toast.error("You must be logged in to buy/rent an item.");
      return;
    }
    if (user.$id === product?.posterId) {
      toast.error("You cannot buy/rent your own listing.");
      return;
    }
    setIsBuyDialogOpen(true);
  };

  const handleAcceptBargain = async (requestId: string) => {
    await updateBargainRequestStatus(requestId, "accepted");
    refetchBargainRequests(); // Refresh requests
  };

  const handleRejectBargain = async (requestId: string) => {
    await updateBargainRequestStatus(requestId, "rejected");
    refetchBargainRequests(); // Refresh requests
  };

  if (isLoadingProduct || isBargainLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-secondary-neon" />
        <p className="ml-3 text-lg text-muted-foreground">Loading product details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <XCircle className="h-10 w-10 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Error</h1>
        <p className="text-muted-foreground text-center">{error}</p>
        <Button onClick={() => navigate("/market")} className="mt-4">Back to Marketplace</Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <XCircle className="h-10 w-10 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Product Not Found</h1>
        <p className="text-muted-foreground text-center">The item you are looking for does not exist.</p>
        <Button onClick={() => navigate("/market")} className="mt-4">Back to Marketplace</Button>
      </div>
    );
  }

  const isMyListing = user?.$id === product.posterId;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Product Details</h1>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-3xl font-bold text-foreground">{product.title}</CardTitle>
            <CardDescription className="text-muted-foreground mt-1">Posted by: {product.posterName} from {product.collegeName}</CardDescription>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="bg-muted text-muted-foreground capitalize">{product.category}</Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 capitalize">
                {product.type}
              </Badge>
              <Badge variant="outline" className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 capitalize">
                Condition: {product.condition.replace(/-/g, ' ')}
              </Badge>
              {product.ambassadorDelivery && (
                <Badge variant="outline" className="flex items-center gap-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  <Truck className="h-3 w-3" /> Ambassador Delivery
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <p className="text-lg text-foreground">{product.description}</p>
            <p className="text-2xl font-bold text-secondary-neon">Price: {product.price}</p>
            {product.type === "rent" && (
              <p className="text-md text-muted-foreground">Rental Period: <span className="font-semibold text-foreground capitalize">{product.rentalPeriod}</span></p>
            )}
            <p className="text-md text-muted-foreground">Contact: <span className="font-semibold text-foreground">{product.contact}</span></p>
          </CardContent>
          <CardFooter className="p-4 pt-0 flex flex-col sm:flex-row gap-2">
            {!isMyListing && product.type !== "gift" && (
              <Dialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" onClick={handleBuyClick}>
                    <ShoppingCart className="mr-2 h-4 w-4" /> {product.type === "sell" ? "Buy Now" : "Rent Now"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">{product.type === "sell" ? "Buy" : "Rent"} {product.title}</DialogTitle>
                  </DialogHeader>
                  <BuyProductDialog product={product} onClose={() => setIsBuyDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            )}
            {!isMyListing && product.type === "gift" && (
              <Button className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" onClick={() => toast.info(`Contacting ${product.posterName} at ${product.contact} to get this item.`)}>
                <ExternalLink className="mr-2 h-4 w-4" /> Get Item
              </Button>
            )}
            {isMyListing && (
              <Button variant="outline" className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted" onClick={() => toast.info("Edit functionality coming soon!")}>
                Edit Listing
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Buyer's Bargain Request Status */}
        {!isMyListing && userBargainRequest && (
          <Card className="bg-card text-card-foreground shadow-lg border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Handshake className="h-5 w-5 text-secondary-neon" /> Your Bargain Request
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              <p className="text-sm text-muted-foreground">
                You offered <span className="font-semibold text-secondary-neon">{userBargainRequest.bargainPrice}</span> for this item.
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                Status:
                <Badge className={cn("px-2 py-1 text-xs font-semibold", {
                  "bg-yellow-500 text-white": userBargainRequest.status === "pending",
                  "bg-green-500 text-white": userBargainRequest.status === "accepted",
                  "bg-red-500 text-white": userBargainRequest.status === "rejected" || userBargainRequest.status === "denied",
                  "bg-gray-500 text-white": userBargainRequest.status === "cancelled",
                })}>
                  {userBargainRequest.status}
                </Badge>
              </p>
              {userBargainRequest.status === "accepted" && (
                <p className="text-sm text-muted-foreground">
                  Your offer was accepted! Contact {product.posterName} at {product.contact} to finalize the transaction.
                </p>
              )}
              {(userBargainRequest.status === "rejected" || userBargainRequest.status === "denied") && (
                <p className="text-sm text-muted-foreground">
                  Your offer was rejected. You can try a new offer or proceed with the original price.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Seller's Pending Bargain Requests */}
        {isMyListing && sellerBargainRequests.length > 0 && (
          <Card className="bg-card text-card-foreground shadow-lg border-border">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Handshake className="h-5 w-5 text-secondary-neon" /> Pending Bargain Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {sellerBargainRequests.map((req) => (
                <div key={req.$id} className="p-3 border border-border rounded-md bg-background">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{req.buyerName}</span> offered{" "}
                    <span className="font-semibold text-secondary-neon">{req.bargainPrice}</span> (Original: {req.originalPrice})
                  </p>
                  {req.message && <p className="text-xs text-muted-foreground mt-1">Message: {req.message}</p>}
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => handleAcceptBargain(req.$id)} className="bg-green-500 hover:bg-green-600 text-white">
                      <CheckCircle className="h-4 w-4 mr-1" /> Accept
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleRejectBargain(req.$id)}>
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ProductDetailsPage;