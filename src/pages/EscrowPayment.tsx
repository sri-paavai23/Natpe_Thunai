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
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { 
    databases, 
    APPWRITE_DATABASE_ID, 
    APPWRITE_TRANSACTIONS_COLLECTION_ID 
} from "@/lib/appwrite";

// Config Constants
const DEVELOPER_UPI = "8903480105@superyes"; 

const EscrowPayment = () => {
  const { transactionId } = useParams<{ transactionId: string }>(); 
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // State
  const [copied, setCopied] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'initial' | 'verifying'>('initial');
  const [utrNumber, setUtrNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amount = searchParams.get("amount") || "0";
  const itemTitle = searchParams.get("title") || "Order Payment";

  // Force strict 2 decimal places (e.g., "10" -> "10.00")
  const formattedAmount = parseFloat(amount).toFixed(2);

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(DEVELOPER_UPI);
    setCopied(true);
    toast.success("UPI ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerUPI = () => {
    // --- NUCLEAR FIX: RAW UPI STRING ---
    // We strictly use ONLY 'pa' (Address) and 'am' (Amount).
    // Removing 'tn' (Note), 'pn' (Name), 'tr' (Ref), 'cu' (Currency).
    // This makes the request look exactly like a manual P2P transfer, bypassing the business filter.
    
    const upiUri = `upi://pay?pa=${DEVELOPER_UPI}&am=${formattedAmount}`;

    // Redirect
    window.location.href = upiUri;

    setPaymentStep('verifying');
    toast.info("App opened. Please complete payment and enter UTR here.");
  };

  const handleVerifyPayment = async () => {
    if (!utrNumber || utrNumber.length < 4) {
        toast.error("Please enter the 12-digit UTR from your UPI app.");
        return;
    }

    if (!transactionId) {
        toast.error("Invalid Order ID. Cannot verify.");
        return;
    }

    setIsSubmitting(true);

    try {
        // UPDATE APPWRITE DATABASE
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

        toast.success("Payment Submitted for Verification!");
        
        setTimeout(() => {
            navigate("/activity/tracking"); 
        }, 1500);

    } catch (error: any) {
        console.error("Verification Failed:", error);
        toast.error("Error: " + (error.message || "Connection failed"));
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
      
      {/* Header Navigation */}
      <div className="w-full max-w-md flex items-center mb-6 absolute top-4 left-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="w-full max-w-md space-y-5 mt-10">
        
        {/* Main Card */}
        <Card className="border-2 border-secondary-neon/20 shadow-xl overflow-hidden">
          <div className="bg-secondary-neon/10 p-4 text-center border-b border-secondary-neon/10">
             <div className="mx-auto bg-background w-14 h-14 rounded-full flex items-center justify-center mb-2 shadow-sm">
               <ShieldCheck className="h-7 w-7 text-secondary-neon" />
             </div>
             <h1 className="text-3xl font-black tracking-tight">₹{formattedAmount}</h1>
             <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">{itemTitle}</p>
          </div>

          <CardContent className="p-6 space-y-6">
            
            {paymentStep === 'initial' ? (
                <>
                    {/* STEP 1: INITIATE PAYMENT */}
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Click "Pay Now" to open your UPI app.
                        </p>
                    </div>

                    <Button 
                        onClick={triggerUPI} 
                        className="w-full h-14 bg-secondary-neon text-primary-foreground font-bold text-lg rounded-xl shadow-lg shadow-secondary-neon/20 hover:bg-secondary-neon/90 transition-all active:scale-[0.98]"
                    >
                        <Wallet className="mr-2 h-5 w-5" /> Pay Now
                    </Button>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or pay manually</span></div>
                    </div>

                    <div className="flex gap-2 items-center">
                        <div className="flex-1 bg-muted/50 border rounded-lg px-3 py-3 text-sm font-mono flex items-center justify-center overflow-hidden truncate">
                            {DEVELOPER_UPI}
                        </div>
                        <Button size="icon" variant="outline" onClick={handleCopyUPI} className="shrink-0 h-10 w-10">
                            {copied ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                        </Button>
                    </div>
                    
                    <p className="text-[10px] text-center text-muted-foreground mt-2">
                        If the button fails, copy the ID above, pay in GPay/PhonePe, then click below.
                    </p>

                    <Button variant="link" size="sm" className="w-full text-xs text-blue-500 h-auto py-1" onClick={() => setPaymentStep('verifying')}>
                        I have already paid → Enter UTR
                    </Button>
                </>
            ) : (
                <>
                    {/* STEP 2: ENTER UTR */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-center animate-in fade-in zoom-in-95">
                        <Info className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                        <h3 className="text-sm font-bold text-blue-700 dark:text-blue-300">Final Step</h3>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Paste the 12-digit <strong>UTR / Transaction ID</strong> from your banking app to confirm.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Label htmlFor="utr">UTR / Transaction ID</Label>
                        <Input 
                            id="utr"
                            placeholder="e.g. 403928190291" 
                            className="text-center font-mono tracking-widest text-lg h-12 uppercase"
                            value={utrNumber}
                            onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))} // Numbers only
                            maxLength={12}
                        />
                        <p className="text-[10px] text-center text-muted-foreground">Do not enter the Google Pay Order ID. Look for "UTR" or "Bank Ref No".</p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1" onClick={() => setPaymentStep('initial')}>Back</Button>
                        <Button 
                            className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold"
                            onClick={handleVerifyPayment}
                            disabled={isSubmitting || utrNumber.length < 4}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Payment"}
                        </Button>
                    </div>
                </>
            )}

          </CardContent>
        </Card>

        {/* Support Note */}
        <div className="flex items-start gap-2 px-2 opacity-80">
            <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-snug">
                <strong>Pro Tip:</strong> If GPay still shows an error, try using PhonePe or Paytm with the "Pay Manually" option above.
            </p>
        </div>

      </div>
    </div>
  );
};

export default EscrowPayment;