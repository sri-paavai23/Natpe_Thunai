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
  AlertTriangle,
  HeartHandshake,
  ExternalLink,
  Info
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
    databases, 
    APPWRITE_DATABASE_ID, 
    APPWRITE_TRANSACTIONS_COLLECTION_ID 
} from "@/lib/appwrite";

// --- CONFIGURATION ---
const DEVELOPER_UPI = "8903480105@superyes"; 

const EscrowPayment = () => {
  const { transactionId: pathId } = useParams<{ transactionId: string }>(); 
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const transactionId = searchParams.get("txnId") || pathId;

  const [copiedVPA, setCopiedVPA] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);

  // Data
  const amount = searchParams.get("amount") || "0";
  const itemTitle = searchParams.get("title") || "Order";
  const formattedAmount = parseFloat(amount).toFixed(2);

  // --- 1. MANUAL COPY HANDLER ---
  const handleCopyVPA = () => {
    navigator.clipboard.writeText(DEVELOPER_UPI);
    setCopiedVPA(true);
    toast.success("UPI ID Copied to Clipboard");
    setTimeout(() => setCopiedVPA(false), 2000);
  };

  // --- 2. OPEN UPI APP HANDLER (GENERIC LAUNCH) ---
  const handleOpenUPI = () => {
    // GENERIC INTENT: Just "upi://pay" without parameters.
    // This triggers the OS to open any installed UPI app to its home screen.
    // The user must then manually navigate to "Pay to ID" and paste.
    const upiLink = "upi://pay";
    
    const link = document.createElement('a');
    link.href = upiLink;
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    
    try {
        link.click();
        
        toast.info("Opening App...", {
            description: "Please paste the copied ID and pay manually."
        });

        // Fallback check if app didn't open
        setTimeout(() => {
             setShowManualDialog(true);
        }, 1500);
        
    } catch (e) {
        setShowManualDialog(true);
    } finally {
        document.body.removeChild(link);
    }
  };

  // --- 3. VERIFICATION HANDLER ---
  const handleVerifyPayment = async () => {
    if (!utrNumber || utrNumber.length < 12) {
        toast.error("Invalid UTR Format", {
            description: "UTR numbers are typically 12 digits long. Please check your SMS/Banking History."
        });
        return;
    }

    if (!transactionId) {
        toast.error("System Error: Order ID Missing", {
            description: "Please return to the Activity Log and retry."
        });
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

        toast.success("Verification Submitted!", {
            description: "Order is processing. Thank you for your honesty!"
        });
        
        setTimeout(() => {
            navigate("/tracking"); 
        }, 1500);

    } catch (error: any) {
        console.error("Verification Error:", error);
        toast.error("Error: " + (error.message || "Connection failed"));
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center font-sans">
      
      {/* Navbar */}
      <div className="w-full max-w-md flex items-center mb-6 absolute top-4 left-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
      </div>

      <div className="w-full max-w-md space-y-6 mt-12 mb-10">
        
        {/* === HEADER === */}
        <div className="text-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="inline-flex items-center justify-center p-4 bg-secondary-neon/10 rounded-full mb-2 border border-secondary-neon/20 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
                <Banknote className="h-8 w-8 text-secondary-neon" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-foreground">
                ₹{formattedAmount}
            </h1>
            <p className="text-sm text-muted-foreground font-medium truncate px-4">
                Escrow for: <span className="text-foreground font-bold">{itemTitle}</span>
            </p>
            {!transactionId && <p className="text-[10px] text-red-500 font-mono">Error: Transaction ID Missing</p>}
        </div>

        {/* === PAYMENT DESK CARD === */}
        <Card className="border-border/60 shadow-xl overflow-hidden animate-in slide-in-from-bottom-8 duration-700 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-0">
            
            {/* Step 1: Pay to Developer */}
            <div className="p-6 space-y-5 border-b border-border/50">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest">Step 1: Pay to Developer</h3>
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                </div>

                {/* COPY ID SECTION - Prominent */}
                <div 
                    onClick={handleCopyVPA}
                    className="group relative flex items-center justify-between bg-muted/40 border-2 border-dashed border-border hover:border-secondary-neon hover:bg-secondary-neon/5 rounded-xl p-4 cursor-pointer transition-all active:scale-[0.98]"
                >
                    <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Tap to Copy ID</p>
                        <p className="text-sm font-mono font-bold text-foreground tracking-wide select-all">{DEVELOPER_UPI}</p>
                    </div>
                    <div className="h-10 w-10 bg-background rounded-full flex items-center justify-center border border-border shadow-sm group-hover:scale-110 transition-transform">
                        {copiedVPA ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5 text-foreground" />}
                    </div>
                </div>

                {/* OPEN APP BUTTON */}
                <Button 
                    onClick={handleOpenUPI}
                    className="w-full h-12 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 font-black text-sm uppercase shadow-lg shadow-secondary-neon/20 transition-transform active:scale-[0.98] rounded-xl"
                >
                    <Smartphone className="mr-2 h-4 w-4" /> Open Payment App
                </Button>
                
                <p className="text-[10px] text-center text-muted-foreground leading-tight px-2">
                    <strong>1. Copy ID</strong> above. <strong>2. Open App</strong>. <strong>3. Paste & Pay ₹{formattedAmount}</strong>.
                </p>
            </div>

            {/* Step 2: The Verification */}
            <div className="p-6 space-y-5 bg-background/30">
                <div className="flex items-center gap-2 mb-1">
                    <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-500">2</span>
                    </div>
                    <h3 className="text-xs font-black uppercase text-muted-foreground tracking-widest">Verify Transaction</h3>
                </div>

                <div className="space-y-3">
                    <Label htmlFor="utr" className="sr-only">UTR</Label>
                    <Input 
                        id="utr"
                        placeholder="ENTER 12-DIGIT UTR ID" 
                        className="text-center font-mono font-bold tracking-widest text-lg h-14 border-2 border-border/60 focus-visible:border-secondary-neon focus-visible:ring-0 bg-background uppercase rounded-xl"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))} 
                        maxLength={12}
                    />
                    <p className="text-[10px] text-muted-foreground text-center px-4 leading-tight">
                        Switch back here and enter the <strong>UTR / UPI Ref No</strong> from your payment receipt.
                    </p>
                </div>

                <Button 
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] rounded-xl"
                    onClick={handleVerifyPayment}
                    disabled={isSubmitting || utrNumber.length < 12}
                >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "VERIFY & COMPLETE"}
                </Button>
            </div>

          </CardContent>
        </Card>

        {/* === MANUAL FALLBACK DIALOG === */}
        <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-500">
                        <Info className="h-5 w-5" /> Launch Failed?
                    </DialogTitle>
                    <DialogDescription>
                        If your app didn't open automatically, please pay manually:
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <ol className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
                        <li><strong>Copy</strong> the UPI ID: <span className="font-mono text-foreground bg-muted px-1 rounded select-all">{DEVELOPER_UPI}</span></li>
                        <li>Open GPay/PhonePe/Paytm manually.</li>
                        <li>Select <strong>"To UPI ID"</strong> and paste.</li>
                        <li>Enter amount <strong>₹{formattedAmount}</strong> and pay.</li>
                        <li>Copy the <strong>UTR</strong> and paste it here.</li>
                    </ol>
                </div>
                <DialogFooter>
                    <Button onClick={() => setShowManualDialog(false)} className="w-full">I Understand</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* === TRUST & ALPHA NOTES === */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-200">
            
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 flex gap-3 items-start">
                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h4 className="text-xs font-bold text-destructive uppercase">Verification Warning</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        We are building a trusted student infrastructure. Please <strong>do not enter random or incorrect UTRs</strong>. 
                        Accounts flagged for fake verifications will be permanently suspended.
                    </p>
                </div>
            </div>

            <div className="flex gap-3 items-start px-2">
                <HeartHandshake className="h-5 w-5 text-secondary-neon shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h4 className="text-xs font-bold text-secondary-neon uppercase">Dev Note: Alpha Phase</h4>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                        Our goal isn't to make you work for payments! We are currently in the Alpha Stability Phase. 
                        Once stable, this entire process will be fully automated. Thank you for cooperating with the manual UTR entry.
                    </p>
                    <div className="pt-2">
                        <Button variant="link" className="h-auto p-0 text-[10px] text-primary" onClick={() => navigate("/developer-messages")}>
                            Facing issues? Message Developer <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>

        </div>

      </div>
    </div>
  );
};

export default EscrowPayment;