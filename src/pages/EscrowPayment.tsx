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
  Wallet,
  Loader2,
  AlertTriangle,
  Smartphone
} from "lucide-react";
import { toast } from "sonner";
import { 
    databases, 
    APPWRITE_DATABASE_ID, 
    APPWRITE_TRANSACTIONS_COLLECTION_ID 
} from "@/lib/appwrite";

// --- CONFIGURATION ---
const DEVELOPER_UPI = "8903480105@superyes"; 

const EscrowPayment = () => {
  const { transactionId } = useParams<{ transactionId: string }>(); 
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State
  const [copiedNote, setCopiedNote] = useState(false);
  const [copiedVPA, setCopiedVPA] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'pay' | 'verify'>('pay');
  const [utrNumber, setUtrNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data
  const amount = searchParams.get("amount") || "0";
  const itemTitle = searchParams.get("title") || "Order";
  const formattedAmount = parseFloat(amount).toFixed(2);

  // --- 1. GENERATE SHORT NOTE ---
  // A simple alphanumeric code (e.g., NT8291)
  const shortNote = `NT${transactionId?.substring(0, 5) || "ORD"}`.toUpperCase();

  // --- 2. THE RAW LINK (NO HUSTLE) ---
  // Only the 'pa' parameter. This is the safest link possible.
  // Apps will treat this as "Send to New Contact" and won't trigger security blocks.
  const rawUpiLink = `upi://pay?pa=${DEVELOPER_UPI}`;

  const handleCopy = (text: string, type: 'note' | 'vpa') => {
    navigator.clipboard.writeText(text);
    if (type === 'note') {
        setCopiedNote(true);
        setTimeout(() => setCopiedNote(false), 2000);
        toast.success("Note copied! Paste in UPI app.");
    } else {
        setCopiedVPA(true);
        setTimeout(() => setCopiedVPA(false), 2000);
        toast.success("UPI ID copied!");
    }
  };

  const handleVerifyPayment = async () => {
    if (!utrNumber || utrNumber.length < 12) {
        toast.error("Invalid UTR. Please check your banking app (12 digits).");
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
      
      {/* Header */}
      <div className="w-full max-w-md flex items-center mb-6 absolute top-4 left-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>

      <div className="w-full max-w-md space-y-6 mt-10">
        
        {/* === SUMMARY CARD === */}
        <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-secondary-neon/10 rounded-full mb-2 border border-secondary-neon/20">
                <ShieldCheck className="h-8 w-8 text-secondary-neon" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground">
                ₹{formattedAmount}
            </h1>
            <p className="text-sm text-muted-foreground font-medium truncate px-4">{itemTitle}</p>
        </div>

        <Card className="border-border/60 shadow-lg animate-in slide-in-from-bottom-4 duration-500 overflow-hidden">
          <CardContent className="p-6">
            
            {paymentStep === 'pay' ? (
                <div className="space-y-6">
                    
                    {/* INSTRUCTIONS */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800 space-y-1">
                        <div className="flex justify-between items-center text-xs text-blue-700 dark:text-blue-300">
                            <span>Amount to Enter:</span>
                            <span className="font-bold">₹{formattedAmount}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-blue-700 dark:text-blue-300">
                            <span>Note to Add:</span>
                            <span className="font-mono font-bold bg-blue-100 dark:bg-blue-800 px-1 rounded cursor-pointer" onClick={() => handleCopy(shortNote, 'note')}>
                                {shortNote} {copiedNote && "✓"}
                            </span>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="space-y-3">
                        {/* 1. The Raw Link Button */}
                        <a 
                            href={rawUpiLink}
                            onClick={() => {
                                toast.info("Enter Amount manually in the app.");
                                setTimeout(() => setPaymentStep('verify'), 3000); // Auto-advance
                            }}
                            className="flex items-center justify-center w-full h-14 bg-secondary-neon hover:bg-secondary-neon/90 text-primary-foreground font-bold text-lg rounded-xl shadow-lg shadow-secondary-neon/20 transition-transform active:scale-[0.98]"
                        >
                            <Wallet className="mr-2 h-5 w-5" /> Pay via UPI App
                        </a>

                        <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-border"></div>
                            <span className="flex-shrink-0 mx-2 text-[10px] text-muted-foreground uppercase">Or Copy VPA</span>
                            <div className="flex-grow border-t border-border"></div>
                        </div>

                        {/* 2. Manual Copy Fallback */}
                        <div className="flex gap-2 items-center">
                            <div className="flex-1 bg-muted/50 border rounded-lg px-3 py-2.5 text-xs font-mono text-center truncate select-all">
                                {DEVELOPER_UPI}
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => handleCopy(DEVELOPER_UPI, 'vpa')} className="shrink-0 h-10 w-10 hover:bg-green-100 dark:hover:bg-green-900/20">
                                {copiedVPA ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                            </Button>
                        </div>
                    </div>

                    <div className="text-center pt-2">
                        <Button variant="link" size="sm" className="text-xs text-blue-500 h-auto p-0" onClick={() => setPaymentStep('verify')}>
                            I've completed the payment →
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    <div className="text-center space-y-1">
                        <div className="bg-green-500/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Smartphone className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="font-bold text-lg">Confirm Payment</h3>
                        <p className="text-xs text-muted-foreground px-4">
                            Paste the 12-digit <strong>UTR / Reference ID</strong> from your banking app to finish.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="utr" className="sr-only">UTR</Label>
                        <Input 
                            id="utr"
                            placeholder="Paste UTR (e.g. 3291...)" 
                            className="text-center font-mono tracking-widest text-xl h-14 border-secondary-neon/30 focus-visible:ring-secondary-neon bg-secondary-neon/5 uppercase"
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
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5"/> Submit Verification</span>}
                    </Button>

                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => setPaymentStep('pay')}>
                        Back
                    </Button>
                </div>
            )}

          </CardContent>
        </Card>

        {/* Tip */}
        {paymentStep === 'pay' && (
            <div className="flex items-start gap-2 px-4 opacity-70">
                <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-snug">
                    Important: Please enter the exact amount <strong>(₹{formattedAmount})</strong> to ensure your order is approved instantly.
                </p>
            </div>
        )}

      </div>
    </div>
  );
};

export default EscrowPayment;