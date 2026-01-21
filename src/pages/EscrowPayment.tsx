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
  Info,
  Loader2,
  QrCode,
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
const DEVELOPER_UPI = "8903480105@superyes"; // Your Personal VPA

const EscrowPayment = () => {
  const { transactionId } = useParams<{ transactionId: string }>(); 
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State
  const [copied, setCopied] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'pay' | 'verify'>('pay');
  const [utrNumber, setUtrNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data
  const amount = searchParams.get("amount") || "0";
  const itemTitle = searchParams.get("title") || "Order Payment";
  
  // STRICT FORMATTING: 2 Decimal Places is mandatory for some bank apps
  const formattedAmount = parseFloat(amount).toFixed(2);

  // --- THE "CLEAN" UPI LINK ---
  // We intentionally OMIT 'tn' (Note), 'pn' (Name), and 'tr' (Ref).
  // This prevents GPay/PhonePe from flagging this as a "Business" transaction.
  const cleanUpiLink = `upi://pay?pa=${DEVELOPER_UPI}&am=${formattedAmount}&cu=INR`;
  
  // QR Code URL (using a public API to generate QR from the clean link)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(cleanUpiLink)}`;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(DEVELOPER_UPI);
    setCopied(true);
    toast.success("UPI ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyPayment = async () => {
    // 1. Validation: UTR must be 12 digits
    if (!utrNumber || utrNumber.length < 12) {
        toast.error("Invalid UTR. Please check your banking app (usually 12 digits).");
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
                transactionId: utrNumber, // Store UTR for Developer verification
                status: "payment_confirmed_to_developer",
                utrId: utrNumber 
            }
        );

        // 3. Success Feedback
        toast.success("Payment Submitted! Verifying...");
        
        // 4. Redirect
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
      
      {/* Back Button */}
      <div className="w-full max-w-md flex items-center mb-4 absolute top-4 left-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="w-full max-w-md space-y-6 mt-8">
        
        {/* === HEADER INFO === */}
        <div className="text-center space-y-1">
             <div className="inline-flex items-center justify-center p-3 bg-secondary-neon/10 rounded-full mb-2">
                <ShieldCheck className="h-8 w-8 text-secondary-neon" />
             </div>
             <h1 className="text-3xl font-black tracking-tighter text-foreground">
                ₹{formattedAmount}
             </h1>
             <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{itemTitle}</p>
        </div>

        {/* === MAIN CARD === */}
        <Card className="border-border/60 shadow-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-6">
            
            {paymentStep === 'pay' ? (
                <div className="space-y-6 flex flex-col items-center">
                    
                    {/* QR Code Section - The Most Reliable Method */}
                    <div className="bg-white p-2 rounded-xl shadow-inner border border-border">
                        <img 
                            src={qrCodeUrl} 
                            alt="Scan to Pay" 
                            className="w-48 h-48 object-contain mix-blend-multiply" 
                        />
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
                        Scan with GPay / PhonePe / Paytm
                    </p>

                    <div className="w-full space-y-3">
                        {/* Direct Link Button */}
                        <a 
                            href={cleanUpiLink}
                            className="flex items-center justify-center w-full h-12 bg-secondary-neon hover:bg-secondary-neon/90 text-primary-foreground font-bold text-base rounded-xl shadow-md transition-transform active:scale-[0.98]"
                            onClick={() => {
                                toast.info("Opening App...");
                                // Auto-switch to verification after a delay, assuming they went to pay
                                setTimeout(() => setPaymentStep('verify'), 2000);
                            }}
                        >
                            <Wallet className="mr-2 h-5 w-5" /> Click to Pay
                        </a>

                        {/* Manual Copy */}
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted/50 border rounded-lg px-3 py-2.5 text-xs font-mono text-center truncate select-all">
                                {DEVELOPER_UPI}
                            </div>
                            <Button size="icon" variant="outline" onClick={handleCopyUPI} className="shrink-0 h-10 w-10">
                                {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <Button variant="ghost" size="sm" className="text-xs text-blue-500" onClick={() => setPaymentStep('verify')}>
                        I have already paid → Enter UTR
                    </Button>
                </div>
            ) : (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    <div className="text-center space-y-1">
                        <div className="bg-blue-500/10 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Smartphone className="h-5 w-5 text-blue-500" />
                        </div>
                        <h3 className="font-bold text-base">Payment Confirmation</h3>
                        <p className="text-xs text-muted-foreground px-4">
                            Please paste the 12-digit <strong>UTR / Reference ID</strong> from your banking app to verify.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="utr" className="sr-only">UTR</Label>
                        <Input 
                            id="utr"
                            placeholder="Enter 12-digit UTR (e.g. 3291...)" 
                            className="text-center font-mono tracking-widest text-lg h-14 border-blue-500/30 focus-visible:ring-blue-500 bg-blue-50/50 dark:bg-blue-900/10 uppercase"
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
                        Back to Payment
                    </Button>
                </div>
            )}

          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default EscrowPayment;