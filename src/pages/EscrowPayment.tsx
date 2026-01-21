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
const APP_NAME = "Natpe Thunai";

const EscrowPayment = () => {
  const { transactionId } = useParams<{ transactionId: string }>(); 
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [copied, setCopied] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  // Data
  const amount = searchParams.get("amount") || "0";
  const itemTitle = searchParams.get("title") || "Order Payment";
  const formattedAmount = parseFloat(amount).toFixed(2);

  // --- 1. GENERATE ROBUST UPI DATA ---
  // We use the simplest possible string to avoid GPay "Business" filters
  // Format: upi://pay?pa=ADDRESS&am=AMOUNT&pn=NAME
  const upiLink = `upi://pay?pa=${DEVELOPER_UPI}&am=${formattedAmount}&pn=${encodeURIComponent(APP_NAME)}`;
  
  // High-Quality QR Code API (Google Charts is deprecated, using QuickChart/GoQR)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiLink)}&bgcolor=ffffff`;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(DEVELOPER_UPI);
    setCopied(true);
    toast.success("UPI ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenApp = () => {
    window.location.href = upiLink;
    setShowVerification(true); // Auto-show verification field after click
    toast.info("Opening app... If it fails, scan the QR code.");
  };

  const handleVerifyPayment = async () => {
    if (!utrNumber || utrNumber.length < 12) {
        toast.error("Invalid UTR. Please check your banking app (usually 12 digits).");
        return;
    }

    if (!transactionId) {
        toast.error("Invalid Order ID.");
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

        toast.success("Payment Submitted! Verifying...");
        
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
        
        {/* === CARD 1: PAYMENT DETAILS (QR + LINK) === */}
        <Card className="border-2 border-secondary-neon/30 shadow-xl overflow-hidden">
          <div className="bg-secondary-neon/10 p-4 text-center border-b border-secondary-neon/10">
             <h1 className="text-3xl font-black tracking-tight flex justify-center items-center gap-2">
                ₹{formattedAmount} <ShieldCheck className="h-6 w-6 text-secondary-neon" />
             </h1>
             <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">{itemTitle}</p>
          </div>

          <CardContent className="p-6 space-y-6">
            
            {/* QR Code Section - The Most Reliable Method */}
            <div className="flex flex-col items-center">
                <div className="p-3 bg-white rounded-xl shadow-inner border border-border">
                    <img 
                        src={qrCodeUrl} 
                        alt="Scan to Pay" 
                        className="w-48 h-48 object-contain mix-blend-multiply" 
                    />
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <QrCode className="h-4 w-4" /> Scan to Pay
                </div>
            </div>

            {/* Actions: App Button & Copy */}
            <div className="space-y-3">
                <Button 
                    onClick={handleOpenApp} 
                    className="w-full h-12 bg-secondary-neon text-primary-foreground font-bold text-base shadow-md hover:bg-secondary-neon/90"
                >
                    <Wallet className="mr-2 h-5 w-5" /> Open Payment App
                </Button>

                <div className="flex items-center gap-2">
                    <div className="flex-1 bg-muted/50 border rounded-lg px-3 py-2.5 text-xs font-mono text-center truncate select-all">
                        {DEVELOPER_UPI}
                    </div>
                    <Button size="icon" variant="outline" onClick={handleCopyUPI} className="shrink-0 h-10 w-10">
                        {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
                <p className="text-[10px] text-center text-muted-foreground">
                    If the button fails, copy the ID or scan the QR code.
                </p>
            </div>

          </CardContent>
        </Card>

        {/* === CARD 2: VERIFICATION (ALWAYS VISIBLE OR TOGGLED) === */}
        <Card className="border border-border bg-card shadow-sm animate-in slide-in-from-bottom-4 fade-in duration-500">
            <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-500/10 p-2 rounded-full">
                        <Smartphone className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Payment Confirmation</h3>
                        <p className="text-xs text-muted-foreground">Required to process your order.</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <Label htmlFor="utr" className="text-xs font-bold uppercase text-muted-foreground">
                        Enter UTR / Reference ID (12 Digits)
                    </Label>
                    <Input 
                        id="utr"
                        placeholder="e.g. 329104829102" 
                        className="text-center font-mono tracking-widest text-lg h-12 border-blue-500/20 focus-visible:ring-blue-500 bg-background"
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))} 
                        maxLength={12}
                    />
                    
                    <Button 
                        className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold"
                        onClick={handleVerifyPayment}
                        disabled={isSubmitting || utrNumber.length < 12}
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                        Verify & Complete Order
                    </Button>
                </div>
            </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default EscrowPayment;