"use client";

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, ArrowLeft, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_CHAT_ROOMS_COLLECTION_ID } from "@/lib/appwrite";
import { Models, ID } from "appwrite";
import { useAuth } from "@/context/AuthContext";

interface Transaction extends Models.Document {
  productId: string; // This is the service ID
  productTitle: string; // This is the service title
  amount: number;
  status: string;
  sellerId: string; // This is the provider ID
  sellerName: string; // This is the provider name
  buyerId: string;
  buyerName: string;
  type: "service";
  utrId?: string;
  collegeName: string;
}

const ServicePaymentConfirmationPage = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [utrId, setUtrId] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionId) {
        setLoading(false);
        return;
      }
      try {
        const doc = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          APPWRITE_TRANSACTIONS_COLLECTION_ID,
          transactionId
        );
        setTransaction(doc as unknown as Transaction);
      } catch (error) {
        console.error("Error fetching transaction:", error);
        toast.error("Failed to load transaction details.");
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [transactionId]);

  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrId.trim()) {
      toast.error("Please enter the UPI Transaction ID (UTR).");
      return;
    }
    if (!transaction || !user || !userProfile) return;

    setIsConfirming(true);
    try {
      // 1. Update transaction status and add UTR ID
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        transactionId!,
        {
          status: "payment_confirmed_to_developer",
          utrId: utrId.trim(),
        }
      );
      toast.success("Payment confirmed! Developers will verify the UTR shortly.");

      // 2. Create Chat Room
      const chatRoomId = ID.unique();
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CHAT_ROOMS_COLLECTION_ID,
        chatRoomId,
        {
          transactionId: transaction.$id,
          serviceId: transaction.productId,
          buyerId: transaction.buyerId,
          providerId: transaction.sellerId,
          buyerUsername: transaction.buyerName, // Use Appwrite user.name as username
          providerUsername: transaction.sellerName, // Use Appwrite user.name as username
          status: "active",
          collegeName: userProfile.collegeName,
        }
      );
      toast.info("Chat room created! Redirecting to chat interface.");

      // 3. Redirect to Chat Page
      navigate(`/chat/${chatRoomId}`);

    } catch (error: any) {
      console.error("Error confirming payment or creating chat room:", error);
      toast.error(error.message || "Failed to confirm payment or create chat room.");
    } finally {
      setIsConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-secondary-neon" />
        <p className="ml-3 text-lg text-muted-foreground">Loading transaction...</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <h1 className="text-4xl font-bold mb-4">Transaction Not Found</h1>
        <Button onClick={() => navigate("/services")} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go to Services
        </Button>
      </div>
    );
  }

  const isPaymentConfirmed = transaction.status !== "initiated";

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20 flex items-center justify-center">
      <Card className="w-full max-w-md bg-card text-card-foreground shadow-lg border-border">
        <CardHeader className="p-4 pb-2 text-center">
          <CardTitle className="text-2xl font-bold text-foreground">
            {isPaymentConfirmed ? "Payment Status" : "Confirm Service Payment"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isPaymentConfirmed 
              ? `This transaction is currently: ${transaction.status.replace(/_/g, ' ')}`
              : "Step 2: Enter the UPI Transaction ID (UTR) after paying the developer."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="p-3 border border-secondary-neon/50 rounded-md bg-secondary-neon/10">
            <p className="text-sm text-muted-foreground">Service: <span className="font-semibold text-foreground">{transaction.productTitle}</span></p>
            <p className="text-lg font-bold text-secondary-neon">Amount Paid: ₹{transaction.amount.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">Transaction ID: {transactionId}</p>
            {transaction.utrId && <p className="text-xs text-muted-foreground">UTR Submitted: {transaction.utrId}</p>}
          </div>

          {isPaymentConfirmed ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-10 w-10 text-secondary-neon mx-auto" />
              <p className="text-lg font-bold text-foreground">Payment {transaction.status.replace(/_/g, ' ')}</p>
              <p className="text-muted-foreground">
                Your payment is being processed or has been completed. You can now access the chat.
              </p>
              <Button onClick={() => navigate(`/chat/${transactionId}`)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <MessageSquareText className="mr-2 h-4 w-4" /> Go to Chat
              </Button>
            </div>
          ) : (
            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div>
                <Label htmlFor="utrId" className="text-foreground">UPI Transaction ID (UTR)</Label>
                <Input
                  id="utrId"
                  type="text"
                  placeholder="e.g., 412345678901"
                  value={utrId}
                  onChange={(e) => setUtrId(e.target.value)}
                  required
                  className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                  disabled={isConfirming}
                />
                <p className="text-xs text-muted-foreground mt-1">This ID is essential for the developer to verify your payment.</p>
              </div>
              <Button type="submit" className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" disabled={isConfirming}>
                {isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" /> Confirm Payment & Start Chat
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => navigate("/activity/tracking")} className="w-full border-border text-primary-foreground hover:bg-muted">
                View Tracking Page
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServicePaymentConfirmationPage;