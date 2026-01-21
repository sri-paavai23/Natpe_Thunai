"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ShieldCheck, 
  Copy, 
  CheckCircle2, 
  ExternalLink, 
  AlertCircle, 
  ArrowLeft,
  Wallet,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DEVELOPER_UPI = "8903480105@superyes";
const DEVELOPER_NAME = "Natpe Thunai Escrow";

const EscrowPayment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Get data from URL
  const amount = searchParams.get("amount") || "0";
  const txnId = searchParams.get("txnId") || "Unknown";
  const itemTitle = searchParams.get("title") || "Campus Order";

  // Formatting amount for UPI standard
  const formattedAmount = Number(amount).toFixed(2);

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(DEVELOPER_UPI);
    setCopied(true);
    toast.success("UPI ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerUPI = () => {
    // PRECISE PARAMETERS FOR PERSONAL ACCOUNTS
    // pa: VPA, pn: Name, am: Amount, cu: Currency, tn: Note, tr: Unique Ref
    const encodedName = encodeURIComponent(DEVELOPER_NAME);
    const encodedNote = encodeURIComponent(`Pay for ${itemTitle}`);
    const uniqueRef = `NT${Date.now()}`; 

    const upiUri = `upi://pay?pa=${DEVELOPER_UPI}&pn=${encodedName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}&tr=${uniqueRef}`;

    // Attempting redirection
    window.location.href = upiUri;
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col items-center">
      {/* Header */}
      <div className="w-full max-w-md flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="flex-1 text-center font-bold text-lg">Escrow Payment</h1>
      </div>

      <div className="w-full max-w-md space-y-4">
        {/* Transaction Summary Card */}
        <Card className="border-2 border-secondary-neon/20 shadow-lg">
          <CardHeader className="pb-2 text-center">
            <div className="mx-auto bg-secondary-neon/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
              <ShieldCheck className="h-6 w-6 text-secondary-neon" />
            </div>
            <CardTitle className="text-2xl font-black">₹{formattedAmount}</CardTitle>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">{itemTitle}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/30 p-3 rounded-lg flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Escrow ID</span>
              <span className="font-mono font-bold">{txnId.substring(0, 10)}</span>
            </div>

            <Button 
              onClick={triggerUPI} 
              className="w-full h-14 bg-secondary-neon text-primary-foreground font-bold text-lg rounded-xl shadow-neon transition-transform active:scale-95"
            >
              <Wallet className="mr-2 h-5 w-5" /> Pay via UPI App
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">
              Supports GPay, PhonePe, Paytm, and more.
            </p>
          </CardContent>
        </Card>

        {/* Manual Method Card */}
        <Card className="border-dashed bg-muted/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Info className="h-4 w-4 text-blue-500" />
              Manual Escrow Method
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              If the button above doesn't open your app, copy the UPI ID below and pay the exact amount manually in any UPI app.
            </p>
            
            <div className="flex gap-2">
              <div className="flex-1 bg-background border rounded-md px-3 py-2 text-xs font-mono flex items-center overflow-hidden">
                {DEVELOPER_UPI}
              </div>
              <Button size="icon" variant="outline" onClick={handleCopyUPI}>
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Safety Notice */}
        <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl flex gap-3">
          <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
          <div className="text-[11px] text-green-700 dark:text-green-400">
            <strong>Escrow Protection:</strong> Your money stays with the developer. It is only released to the seller after YOU confirm receipt of the item/service.
          </div>
        </div>
      </div>
    </div>
  );
};

export default EscrowPayment;