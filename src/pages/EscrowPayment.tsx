"use client";

import React, { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ShieldCheck, 
  ArrowLeft,
  Wallet,
  Loader2,
  CheckCircle2,
  Smartphone
} from "lucide-react";
import { toast } from "sonner";
import { 
    databases, 
    APPWRITE_DATABASE_ID, 
    APPWRITE_TRANSACTIONS_COLLECTION_ID 
} from "@/lib/appwrite";

// Config
const DEVELOPER_UPI = "8903480105@superyes"; 

const EscrowPayment = () => {
  const { transactionId } = useParams<{ transactionId: string }>(); 
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [paymentStep, setPaymentStep] = useState<'pay' | 'verify'>('pay');
  const [utrNumber, setUtrNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data
  const amount = searchParams.get("amount") || "0";
  const itemTitle = searchParams.get("title") || "Order Payment";
  
  // Strict Amount Formatting (Critical for banking apps)
  const formattedAmount = parseFloat(amount).toFixed(2);

  // --- THE GOLDEN LINK ---
  // We strip EVERYTHING except the Address and Amount. 
  // No Note (tn), No Name (pn), No Ref (tr).
  // This bypasses the "Business Transaction" filter on GPay.
  const upiDeepLink = `upi://pay?pa=${DEVELOPER_UPI}&am=${formattedAmount}&cu=INR`;

  const handlePayClick = () => {
    // We switch to verification view immediately because the app will open
    setPaymentStep('verify');
    toast.info("Opening Payment App...");
  };

  const handleVerifyPayment = async () => {
    // 1. Validation
    if (!utrNumber || utrNumber.length < 12) {
        toast.error("Invalid UTR. Please copy the 12-digit ID from your banking app.");
        return;
    }

    if (!transactionId) {
        toast.error("System Error: Invalid Order ID.");
        return;
    }

    setIsSubmitting(true);

    try {
        // 2. Database Update
        await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_TRANSACTIONS_COLLECTION_ID,
            transactionId, 
            {
                transactionId: utrNumber, // User provided UTR
                status: "payment_confirmed_to_developer",
                utrId: utrNumber 
            }
        );

        // 3. Success Feedback
        toast.success("Payment Verified! Order Processing.");
        
        // 4. Redirect
        setTimeout(() => {
            navigate("/activity/tracking"); 
        }, 1000);

    } catch (error: any) {
        console.error("Verification Error:", error);
        toast.error("Error: " + (error.message || "Connection failed"));
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
      
      {/* Navbar */}
      <div className="w-full max-w-md flex items-center mb-6 absolute top-4 left-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>

      <div className="w-full max-w-md space-y-6 mt-8">
        
        {/* === HEADER CARD === */}
        <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-secondary-neon/10 rounded-full mb-2">
                <ShieldCheck className="h-8 w-8 text-secondary-neon" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground">
                ₹{formattedAmount}
            </h1>
            <p className="text-sm text-muted-foreground font-medium">{itemTitle}</p>
        </div>

        {/* === ACTION CARD === */}
        <Card className="border-border/60 shadow-lg animate-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-6">
            
            {paymentStep === 'pay' ? (
                <div className="space-y-6">
                    <div className="space-y-2 text-center">
                        <h3 className="font-bold text-lg">Select Payment Method</h3>
                        <p className="text-xs text-muted-foreground">
                            Tap below to pay securely via GPay, PhonePe, or Paytm.
                        </p>
                    </div>

                    {/* DIRECT DEEP LINK BUTTON 
                        Using <a> tag ensures native OS handling better than JS window.open 
                    */}
                    <a 
                        href={upiDeepLink}
                        onClick={handlePayClick}
                        className="flex items-center justify-center w-full h-14 bg-secondary-neon hover:bg-secondary-neon/90 text-primary-foreground font-bold text-lg rounded-xl shadow-lg shadow-secondary-neon/20 transition-transform active:scale-[0.98]"
                    >
                        <Wallet className="mr-2 h-5 w-5" /> Pay Now
                    </a>

                    <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">
                            Paying to: <span className="font-mono bg-muted px-1 rounded">{DEVELOPER_UPI}</span>
                        </p>
                    </div>

                    {/* Fallback for already paid */}
                    <div className="border-t border-dashed pt-4 text-center">
                        <Button variant="link" size="sm" className="text-xs text-blue-500 h-auto p-0" onClick={() => setPaymentStep('verify')}>
                            I already completed the payment
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    <div className="text-center space-y-1">
                        <div className="bg-blue-500/10 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Smartphone className="h-5 w-5 text-blue-500" />
                        </div>
                        <h3 className="font-bold text-base">Confirm Transaction</h3>
                        <p className="text-xs text-muted-foreground">
                            Paste the 12-digit <strong>UTR / Ref No.</strong> from your app to finish.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="utr" className="sr-only">UTR</Label>
                        <Input 
                            id="utr"
                            placeholder="Paste UTR (e.g. 329104829102)" 
                            className="text-center font-mono tracking-widest text-lg h-14 border-blue-500/30 focus-visible:ring-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                            value={utrNumber}
                            onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))} 
                            maxLength={12}
                            autoFocus
                        />
                    </div>

                    <Button 
                        className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-base shadow-md transition-all active:scale-[0.98]"
                        onClick={handleVerifyPayment}
                        disabled={isSubmitting || utrNumber.length < 12}
                    >
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5"/> Verify Payment</span>}
                    </Button>

                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => setPaymentStep('pay')}>
                        Go Back
                    </Button>
                </div>
            )}

          </CardContent>
        </Card>

        {/* TRUST BADGE */}
        <div className="flex justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" className="h-4" alt="GPay" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" className="h-4" alt="PhonePe" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo_%28standalone%29.svg" className="h-4" alt="Paytm" />
        </div>

      </div>
    </div>
  );
};

export default EscrowPayment;