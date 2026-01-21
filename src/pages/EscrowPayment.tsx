"use client";

import React, { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ShieldCheck, 
  Copy, 
  CheckCircle2, 
  ArrowLeft,
  Loader2,
  Banknote,
  Smartphone,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { 
    databases, 
    APPWRITE_DATABASE_ID, 
    APPWRITE_TRANSACTIONS_COLLECTION_ID 
} from "@/lib/appwrite";

// --- CONFIGURATION ---
const DEVELOPER_UPI = "8903480105@superyes"; 
const DEVELOPER_NAME = "Natpe Thunai";

const EscrowPayment = () => {
  const { transactionId } = useParams<{ transactionId: string }>(); 
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [copiedVPA, setCopiedVPA] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data
  const amount = searchParams.get("amount") || "0";
  const itemTitle = searchParams.get("title") || "Order";
  const formattedAmount = parseFloat(amount).toFixed(2);

  // --- MANUAL COPY HANDLER ---
  const handleCopyVPA = () => {
    navigator.clipboard.writeText(DEVELOPER_UPI);
    setCopiedVPA(true);
    toast.success("UPI ID Copied! Open your app to pay.");
    setTimeout(() => setCopiedVPA(false), 2000);
  };

  // --- VERIFICATION HANDLER ---
  const handleVerifyPayment = async () => {
    if (!utrNumber || utrNumber.length < 12) {
        toast.error("Invalid UTR. It must be 12 digits (check your banking SMS/History).");
        return;
    }

    if (!transactionId) {
        toast.error("System Error: Invalid Order ID.");
        return;
    }

    setIsSubmitting(true);

    try {
        await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_TRANSACTIONS_COLLECTION_ID,
            transactionId, 
            {
                transactionId: utrNumber, 
                status: "payment_confirmed_to_developer",
                utrId: utrNumber 
            }
        );

        toast.success("Payment Verified! Order Processing.");
        
        setTimeout(() => {
            navigate("/activity/tracking"); 
        }, 1500);

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

      <div className="w-full max-w-md space-y-6 mt-10">
        
        {/* === HEADER === */}
        <div className="text-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="inline-flex items-center justify-center p-4 bg-secondary-neon/10 rounded-full mb-2 border border-secondary-neon/20 shadow-neon">
                <Banknote className="h-8 w-8 text-secondary-neon" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground">
                ₹{formattedAmount}
            </h1>
            <p className="text-sm text-muted-foreground font-medium truncate px-4">
                Paying for: <span className="text-foreground font-bold">{itemTitle}</span>
            </p>
        </div>

        {/* === PAYMENT DESK CARD === */}
        <Card className="border-border/60 shadow-xl overflow-hidden animate-in slide-in-from-bottom-8 duration-700 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-0">
            
            {/* Step 1: The Copy Action */}
            <div className="p-6 space-y-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Step 1: Copy UPI ID</h3>
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                </div>
                
                <div 
                    onClick={handleCopyVPA}
                    className="group relative flex items-center justify-between bg-muted/50 border-2 border-dashed border-border hover:border-secondary-neon hover:bg-secondary-neon/5 rounded-xl p-4 cursor-pointer transition-all active:scale-[0.98]"
                >
                    <div>
                        <p className="text-xs text-muted-foreground font-medium mb-1">Send Payment To:</p>
                        <p className="text-lg font-mono font-bold text-foreground tracking-wide">{DEVELOPER_UPI}</p>
                    </div>
                    <div className="h-10 w-10 bg-background rounded-full flex items-center justify-center border border-border shadow-sm group-hover:scale-110 transition-transform">
                        {copiedVPA ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-foreground" />}
                    </div>
                </div>
                
                <p className="text-[10px] text-center text-muted-foreground">
                    Tap the box above to copy. Open GPay/PhonePe/Paytm and pay <strong>₹{formattedAmount}</strong>.
                </p>
            </div>

            {/* Step 2: The Verification */}
            <div className="p-6 space-y-5 bg-background/50">
                <div className="flex items-center gap-2 mb-1">
                    <Smartphone className="h-4 w-4 text-blue-500" />
                    <h3 className="text-sm font-bold uppercase text-muted-foreground tracking-wider">Step 2: Enter Transaction ID</h3>
                </div>

                <div className="space-y-3">
                    <Label htmlFor="utr" className="sr-only">UTR</Label>
                    <Input 
                        id="utr"
                        placeholder="Paste 12-digit UTR (e.g. 3291...)" 
                        className="text-center font-mono tracking-widest text-lg h-14 border-primary/20 focus-visible:ring-secondary-neon bg-background uppercase"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))} 
                        maxLength={12}
                    />
                    <p className="text-[10px] text-muted-foreground text-center px-4">
                        Check your banking app's "History" for the <strong>UTR / UPI Ref No</strong>.
                    </p>
                </div>

                <Button 
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-base shadow-lg shadow-green-500/20 transition-all active:scale-[0.98]"
                    onClick={handleVerifyPayment}
                    disabled={isSubmitting || utrNumber.length < 12}
                >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5"/> Verify Payment</span>}
                </Button>
            </div>

          </CardContent>
        </Card>

        {/* Trust Footer */}
        <div className="text-center opacity-60">
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Secure Escrow • Money held safely until delivery
            </p>
        </div>

      </div>
    </div>
  );
};

export default EscrowPayment;