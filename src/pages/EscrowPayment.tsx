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
  AlertTriangle,
  QrCode,
  Smartphone
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
  const [utrNumber, setUtrNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amount = searchParams.get("amount") || "0";
  const itemTitle = searchParams.get("title") || "Order Payment";
  const formattedAmount = parseFloat(amount).toFixed(2);

  // Generate UPI String (Standard Format)
  // We use this for the QR Code data
  const upiString = `upi://pay?pa=${DEVELOPER_UPI}&am=${formattedAmount}&pn=NatpeThunai`;
  
  // Public API to generate QR Code image (No external libraries needed)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiString)}`;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(DEVELOPER_UPI);
    setCopied(true);
    toast.success("UPI ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyPayment = async () => {
    if (!utrNumber || utrNumber.length < 4) {
        toast.error("Please enter the 12-digit UTR from your UPI app.");
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

        toast.success("Payment Verified! Redirecting...");
        
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
      
      {/* Header */}
      <div className="w-full max-w-md flex items-center mb-6 absolute top-4 left-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="w-full max-w-md space-y-5 mt-8">
        
        {/* Main Payment Card */}
        <Card className="border-2 border-secondary-neon/20 shadow-xl overflow-hidden">
          <div className="bg-secondary-neon/10 p-4 text-center border-b border-secondary-neon/10">
             <div className="mx-auto bg-background w-12 h-12 rounded-full flex items-center justify-center mb-2 shadow-sm">
               <ShieldCheck className="h-6 w-6 text-secondary-neon" />
             </div>
             <h1 className="text-2xl font-black tracking-tight">₹{formattedAmount}</h1>
             <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{itemTitle}</p>
          </div>

          <CardContent className="p-6 space-y-6 flex flex-col items-center">
            
            {/* 1. QR Code Display */}
            <div className="bg-white p-2 rounded-xl shadow-sm border border-border/50">
                <img 
                    src={qrCodeUrl} 
                    alt="Scan to Pay" 
                    className="w-40 h-40 object-contain"
                />
            </div>
            
            <div className="text-center space-y-1">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-1">
                    <QrCode className="h-3 w-3" /> Scan with GPay / Paytm
                </div>
                <div className="text-[10px] text-muted-foreground">OR</div>
            </div>

            {/* 2. Manual Copy Section */}
            <div className="w-full space-y-2">
                <div className="flex gap-2 items-center w-full">
                    <div className="flex-1 bg-muted/50 border rounded-lg px-3 py-3 text-sm font-mono flex items-center justify-center overflow-hidden text-center truncate">
                        {DEVELOPER_UPI}
                    </div>
                    <Button size="icon" variant="outline" onClick={handleCopyUPI} className="shrink-0 h-11 w-11 bg-card hover:bg-secondary-neon/10 hover:text-secondary-neon transition-colors">
                        {copied ? <CheckCircle2 className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                    </Button>
                </div>
                <p className="text-[10px] text-center text-muted-foreground">
                    Copy ID & pay manually if scanner fails.
                </p>
            </div>

            <div className="w-full border-t border-dashed border-border/60 my-2" />

            {/* 3. Verification Section */}
            <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-500/10 p-1.5 rounded-full">
                        <Smartphone className="h-4 w-4 text-blue-500" />
                    </div>
                    <Label htmlFor="utr" className="text-sm font-bold">Paste UTR / Transaction ID</Label>
                </div>
                
                <Input 
                    id="utr"
                    placeholder="Enter 12-digit UTR (e.g. 329104829102)" 
                    className="text-center font-mono tracking-widest text-lg h-12 uppercase border-blue-500/20 focus-visible:ring-blue-500"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.replace(/[^0-9]/g, ''))} 
                    maxLength={12}
                />
                
                <Button 
                    className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold text-base shadow-lg shadow-green-600/20 transition-all active:scale-[0.98]"
                    onClick={handleVerifyPayment}
                    disabled={isSubmitting || utrNumber.length < 12}
                >
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Payment"}
                </Button>
            </div>

          </CardContent>
        </Card>

        {/* Helper Footer */}
        <div className="flex items-start gap-3 px-3 py-2 bg-yellow-500/5 border border-yellow-500/10 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-yellow-700/80 dark:text-yellow-400/80 leading-snug">
                <strong>Why Manual?</strong> To keep fees low and secure, we verify payments manually via UTR. Your money is 100% safe in Escrow.
            </p>
        </div>

      </div>
    </div>
  );
};

export default EscrowPayment;