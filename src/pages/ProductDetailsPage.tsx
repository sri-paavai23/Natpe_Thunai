"use client";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowLeft, MessageSquare, Flag, ThumbsUp, ThumbsDown, Send, Loader2 } from "lucide-react"; // Added Loader2
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_PRODUCTS_COLLECTION_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_USER_PROFILES_COLLECTION_ID } from "@/lib/appwrite";
import { ID, Query } from 'appwrite';
import { dummyProducts } from "./MarketPage"; // Import dummy products

interface Product {
  $id: string; // Appwrite document ID
  imageUrl: string;
  title: string;
  price: string;
  sellerRating: number;
  sellerBadge?: string;
  type: "sell" | "rent" | "gift" | "sports" | "gift-request";
  description: string;
  damages?: string;
  policies?: string;
  condition?: string;
  ambassadorDelivery?: boolean;
  ambassadorMessage?: string;
  referenceImageUrl?: string;
  budget?: string;
  contact?: string;
  sellerId: string;
  sellerName: string;
  sellerUpiId?: string;
}

// Simulated Blocked Word List (In a real app, this would come from an API/Database)
const BLOCKED_WORDS = ["badword", "spam", "scam", "fraud", "abuse", "hate"];

const containsBlockedWords = (text: string): boolean => {
  const lowerText = text.toLowerCase();
  return BLOCKED_WORDS.some(word => lowerText.includes(word));
};

const ProductDetailsPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { userProfile, user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [feedbackText, setFeedbackText] = useState("");
  const [reportText, setReportText] = useState("");
  const [rating, setRating] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setLoadingProduct(false);
        return;
      }
      try {
        const fetchedProduct = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_PRODUCTS_COLLECTION_ID,
          productId
        );
        setProduct(fetchedProduct as unknown as Product);
      } catch (error: any) {
        console.error("Error fetching product details from Appwrite:", error);
        // If Appwrite fetch fails, check if it's a dummy product
        const foundDummy = dummyProducts.find(p => p.$id === productId);
        if (foundDummy) {
          setProduct(foundDummy);
          toast.info("Displaying dummy product details.");
        } else {
          toast.error("Failed to load product details. Product not found.");
          setProduct(null);
        }
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loadingProduct) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <Loader2 className="h-10 w-10 animate-spin text-secondary-neon mb-4" />
        <p className="text-xl text-muted-foreground">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <h1 className="text-4xl font-bold mb-4">Product Not Found</h1>
        <p className="text-xl text-muted-foreground mb-6">
          The product you are looking for does not exist.
        </p>
        <Button onClick={() => navigate(-1)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const handlePayment = async (action: "buy" | "rent") => {
    if (!userProfile || !userProfile.upiId) {
      toast.error("Please set up your UPI ID in your profile to proceed with payments.");
      navigate("/profile/wallet");
      return;
    }
    if (!user || !user.$id) {
      toast.error("You must be logged in to make a purchase.");
      return;
    }
    if (!product.sellerId) {
      toast.error("Seller information is missing for this product.");
      return;
    }

    const developerUpiId = "8903480105@superyes"; // Updated developer UPI ID
    const amount = parseFloat(product.price.replace(/[^0-9.]/g, ''));
    const transactionNote = `${action === "buy" ? "Purchase" : "Rent"} of ${product.title} from Natpe🤝Thunai.`;

    try {
      // Fetch seller's profile to get their UPI ID and full name
      const sellerProfiles = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_USER_PROFILES_COLLECTION_ID,
        [Query.equal('userId', product.sellerId)]
      );

      if (sellerProfiles.documents.length === 0) {
        toast.error("Seller profile not found. Cannot proceed with transaction.");
        return;
      }
      const sellerProfile = sellerProfiles.documents[0] as any;
      const sellerUpiId = sellerProfile.upiId;
      const sellerFullName = `${sellerProfile.firstName} ${sellerProfile.lastName}`;

      // Get buyer's full name
      const buyerFullName = userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : user.name;

      // 1. Create a transaction document in Appwrite
      const newTransaction = await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        ID.unique(), // Use Appwrite's $id
        {
          productId: product.$id, // Use Appwrite's $id
          buyerId: user.$id,
          buyerName: buyerFullName,
          sellerId: product.sellerId,
          sellerName: sellerFullName,
          sellerUpiId: sellerUpiId,
          amount: amount,
          status: "initiated",
          type: action,
          productTitle: product.title,
        }
      );
      toast.info("Transaction initiated. Redirecting to your banking app for payment.");
      toast.info("Remember: You pay the developers first. They will take their commission and then pay the seller.");

      // 2. Construct UPI deep link
      const upiDeepLink = `upi://pay?pa=${developerUpiId}&pn=NatpeThunaiDevelopers&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

      // 3. Open UPI deep link
      window.open(upiDeepLink, "_blank");

      // Simulate payment processing time and update status
      setTimeout(async () => {
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_TRANSACTIONS_COLLECTION_ID,
          newTransaction.$id,
          { status: "payment_confirmed_to_developer" }
        );
        toast.success("Payment confirmed to developer! Transaction status updated.");
        navigate("/activity/tracking");
      }, 5000);

    } catch (error: any) {
      console.error("Error during payment initiation:", error);
      toast.error(error.message || "Failed to initiate payment. Please try again.");
    }
  };

  const handleBargain = () => {
    if (!product.sellerId) {
      toast.error("Seller information is missing for this product. Cannot bargain.");
      return;
    }
    const originalPrice = parseFloat(product.price.replace(/[^0-9.]/g, ''));
    const bargainedPrice = originalPrice * 0.85;
    
    toast.info(`Bargain offer of ₹${bargainedPrice.toFixed(2)} sent for "${product.title}". Seller will be notified.`);
  };

  const handleSendFeedback = () => {
    if (feedbackText.trim()) {
      if (containsBlockedWords(feedbackText)) {
        toast.error("Your feedback contains blocked words. Please revise.");
        return;
      }
      toast.success(`Feedback sent for "${product.title}": "${feedbackText}"`);
      setFeedbackText("");
    } else {
      toast.error("Feedback cannot be empty.");
    }
  };

  const handleSendReport = () => {
    if (reportText.trim()) {
      if (containsBlockedWords(reportText)) {
        toast.error("Your report contains blocked words. Please revise.");
        return;
      }
      toast.success(`Report sent for "${product.title}": "${reportText}"`);
      setReportText("");
    } else {
      toast.error("Report cannot be empty.");
    }
  };

  const handleRating = (starCount: number) => {
    setRating(starCount);
    toast.success(`You rated "${product.title}" ${starCount} stars!`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-secondary-neon">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Market
        </Button>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <img src={product.imageUrl} alt={product.title} className="w-full h-64 object-cover rounded-t-lg" />
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-3xl font-bold text-foreground">{product.title}</CardTitle>
            <CardDescription className="text-xl font-bold text-secondary-neon mt-1">{product.price}</CardDescription>
            <div className="flex items-center text-sm text-muted-foreground mt-2">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
              <span>{product.sellerRating.toFixed(1)} Seller Rating</span>
              {product.sellerBadge && (
                <Badge variant="secondary" className="ml-2 bg-primary-blue-light text-primary-foreground">
                  {product.sellerBadge}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div>
              <h4 className="font-semibold text-foreground mb-1">Description:</h4>
              <p className="text-sm text-muted-foreground">{product.description}</p>
            </div>
            {product.damages && (
              <div>
                <h4 className="font-semibold text-foreground mb-1">Damages:</h4>
                <p className="text-sm text-muted-foreground">{product.damages}</p>
              </div>
            )}
            {product.policies && (
              <div>
                <h4 className="font-semibold text-foreground mb-1">Policies:</h4>
                <p className="text-sm text-muted-foreground">{product.policies}</p>
              </div>
            )}
            {product.condition && (
              <div>
                <h4 className="font-semibold text-foreground mb-1">Condition:</h4>
                <p className="text-sm text-muted-foreground">{product.condition}</p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button
                className="flex-1 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
                onClick={() => handlePayment(product.type === "rent" ? "rent" : "buy")}
              >
                {product.type === "rent" ? "Rent Now" : "Buy Now"}
              </Button>
              <Button
                variant="outline"
                className="flex-1 border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10"
                onClick={handleBargain}
              >
                Bargain
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feedback & Rating Section */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-secondary-neon" /> Feedback & Rating
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div>
              <Label htmlFor="feedback" className="text-foreground">Your Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Share your thoughts on this product/service..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="bg-input text-foreground border-border focus:ring-ring focus:border-ring mt-1"
              />
              <Button onClick={handleSendFeedback} className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Send className="mr-2 h-4 w-4" /> Send Feedback
              </Button>
            </div>
            <Separator />
            <div>
              <Label className="text-foreground mb-2 block">Rate this Product/Service</Label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-6 w-6 cursor-pointer ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                    onClick={() => handleRating(star)}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Section */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Flag className="h-5 w-5 text-destructive" /> Report Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div>
              <Label htmlFor="report" className="text-foreground">Describe the Issue</Label>
              <Textarea
                id="report"
                placeholder="e.g., Item not as described, seller unresponsive, inappropriate content."
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                className="bg-input text-foreground border-border focus:ring-ring focus:border-ring mt-1"
              />
              <Button onClick={handleSendReport} className="w-full mt-2 bg-destructive text-destructive-foreground hover:bg-destructive/90">
                <Flag className="mr-2 h-4 w-4" /> Submit Report
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Note: Content is checked against a list of blocked words to maintain community safety.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductDetailsPage;