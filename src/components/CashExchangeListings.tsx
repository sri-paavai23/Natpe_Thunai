"use client";

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Clock, Handshake, CheckCircle, Loader2, AlertTriangle, Users, TrendingUp } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress"; // Ensure you have this shadcn component
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID, APPWRITE_CASH_EXCHANGE_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from "appwrite";

interface Listing {
  $id: string;
  $createdAt: string;
  type: "request" | "offer" | "group-contribution";
  amount: number;
  collectedAmount?: number; // New Field
  contributors?: string; // New Field (JSON String)
  notes: string;
  status: string;
  meetingLocation: string;
  meetingTime: string;
  posterId: string;
  posterName: string;
  collegeName: string;
}

interface CashExchangeListingsProps {
  listings: Listing[];
  isLoading: boolean;
  type: "request" | "offer" | "group-contribution";
}

const CashExchangeListings: React.FC<CashExchangeListingsProps> = ({ listings, isLoading, type }) => {
  const { user } = useAuth();
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State for Group Contribution Input
  const [contributionAmount, setContributionAmount] = useState<string>("");

  // Helper: Button Text
  const getActionButtonText = (listingType: string) => {
    switch (listingType) {
      case "request": return "Contribute (I have Cash)";
      case "offer": return "Accept (I need Cash)";
      case "group-contribution": return "Join Split";
      default: return "Connect";
    }
  };

  const handleActionClick = (listing: Listing) => {
    if (!user) {
      toast.error("Please log in to participate.");
      return;
    }
    if (user.$id === listing.posterId) {
      toast.info("You cannot contribute to your own post.");
      return;
    }
    
    setSelectedListing(listing);
    // If group, set default contribution to remaining amount or 0
    if (listing.type === 'group-contribution') {
        const remaining = listing.amount - (listing.collectedAmount || 0);
        setContributionAmount(remaining.toString());
    }
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedListing || !user) return;

    setIsProcessing(true);
    try {
      
      // --- LOGIC FOR GROUP CONTRIBUTION (SPLIT) ---
      if (selectedListing.type === 'group-contribution') {
        const payAmount = parseFloat(contributionAmount);
        const currentCollected = selectedListing.collectedAmount || 0;
        const remaining = selectedListing.amount - currentCollected;

        if (isNaN(payAmount) || payAmount <= 0) {
            throw new Error("Please enter a valid amount.");
        }
        if (payAmount > remaining) {
            throw new Error(`You cannot contribute more than the remaining amount (₹${remaining}).`);
        }

        // 1. Prepare Data for Update
        const newCollected = currentCollected + payAmount;
        const isCompleted = newCollected >= selectedListing.amount;
        
        let currentContributors = [];
        try {
            currentContributors = selectedListing.contributors ? JSON.parse(selectedListing.contributors) : [];
        } catch (e) { currentContributors = []; }

        currentContributors.push({
            userId: user.$id,
            name: user.name,
            amount: payAmount,
            date: new Date().toISOString()
        });

        // 2. Update the Listing Document
        await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_CASH_EXCHANGE_COLLECTION_ID,
            selectedListing.$id,
            {
                collectedAmount: newCollected,
                contributors: JSON.stringify(currentContributors),
                status: isCompleted ? "Completed" : "Open"
            }
        );

        // 3. Create Transaction Notification (To Poster)
        await createTransactionRecord(
            selectedListing, 
            payAmount, 
            `User contributed ₹${payAmount} to your split.`
        );

        toast.success(`You contributed ₹${payAmount}!`);
      } 
      
      // --- LOGIC FOR STANDARD REQUEST/OFFER ---
      else {
        // Mark as Accepted immediately for 1-on-1 exchanges
        await databases.updateDocument(
            APPWRITE_DATABASE_ID,
            APPWRITE_CASH_EXCHANGE_COLLECTION_ID,
            selectedListing.$id,
            { status: "Accepted" } // Or "Meeting Scheduled" depending on your flow
        );

        await createTransactionRecord(
            selectedListing, 
            selectedListing.amount, 
            `Meeting scheduled at ${selectedListing.meetingLocation}`
        );
        toast.success("Connection successful! Poster notified.");
      }

      setIsConfirmDialogOpen(false);
      // Optional: Refresh data here if not using realtime
      window.location.reload(); 

    } catch (error: any) {
      console.error("Error processing:", error);
      toast.error(error.message || "Failed to process.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper to create transaction record
  const createTransactionRecord = async (listing: Listing, amount: number, msg: string) => {
    if (!user) return;
    await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          productId: listing.$id,
          productTitle: listing.type === 'group-contribution' ? `Split: ${listing.notes}` : `Cash ${listing.type}`,
          amount: amount,
          buyerId: user.$id,
          buyerName: user.name,
          sellerId: listing.posterId,
          sellerName: listing.posterName,
          status: "meeting_scheduled",
          type: "cash-exchange",
          collegeName: listing.collegeName,
          ambassadorDelivery: false,
          ambassadorMessage: msg
        }
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-secondary-neon" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No active {type}s found. Be the first to post!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => {
        const isOwner = user?.$id === listing.posterId;
        const isActive = listing.status !== "Completed" && listing.status !== "Accepted";
        
        // Group Logic Calculation
        const collected = listing.collectedAmount || 0;
        const percentage = Math.min(100, (collected / listing.amount) * 100);
        const remaining = listing.amount - collected;

        return (
          <Card key={listing.$id} className="bg-background border border-border hover:border-secondary-neon/50 transition-colors">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${listing.posterName}`} />
                    <AvatarFallback>{listing.posterName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{listing.posterName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(listing.$createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant={listing.type === 'request' ? 'destructive' : (listing.type === 'group-contribution' ? 'secondary' : 'default')} className="uppercase text-[10px]">
                  {listing.type === 'group-contribution' ? 'Group Split' : listing.type}
                </Badge>
              </div>

              {/* Main Amount Section */}
              <div className="flex justify-between items-center my-3">
                <span className="text-2xl font-bold text-foreground">₹{listing.amount}</span>
                {!isActive ? (
                  <Badge variant="secondary">{listing.status}</Badge>
                ) : (
                  <Badge variant="outline" className="text-green-500 border-green-500">Open</Badge>
                )}
              </div>

              {/* Special UI for Group Contribution */}
              {listing.type === 'group-contribution' && (
                <div className="mb-4 space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Collected: <span className="text-green-500 font-bold">₹{collected}</span></span>
                        <span>Remaining: <span className="text-red-500 font-bold">₹{remaining}</span></span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                </div>
              )}

              <p className="text-sm text-muted-foreground mb-4 bg-muted/50 p-2 rounded-md italic">
                "{listing.notes}"
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {listing.meetingLocation}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {listing.meetingTime}
                </div>
              </div>

              {/* ACTION BUTTON */}
              {!isOwner && isActive && (
                <Button 
                  className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 font-semibold shadow-sm"
                  onClick={() => handleActionClick(listing)}
                >
                  {listing.type === 'group-contribution' ? <Users className="mr-2 h-4 w-4"/> : <Handshake className="mr-2 h-4 w-4" />} 
                  {getActionButtonText(listing.type)}
                </Button>
              )}

              {isOwner && (
                <div className="w-full text-center text-xs text-muted-foreground py-2 border-t border-dashed border-border mt-2">
                  (This is your post)
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* CONFIRMATION DIALOG */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-secondary-neon" /> 
              {selectedListing?.type === 'group-contribution' ? 'Contribute to Split' : 'Confirm Action'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground pt-2">
              
              {/* Safety Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-md mb-3 text-yellow-600 dark:text-yellow-400 text-xs">
                <span className="font-bold flex items-center gap-1 mb-1"><AlertTriangle className="h-3 w-3" /> Safety First:</span>
                Ensure you meet <strong>{selectedListing?.posterName}</strong> in a public place.
              </div>

              {/* Dynamic Content based on Type */}
              {selectedListing?.type === 'group-contribution' ? (
                <div className="space-y-4">
                    <p className="text-sm">How much would you like to contribute to this split?</p>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span>Total Needed: ₹{selectedListing.amount}</span>
                            <span className="text-red-500">Remaining: ₹{selectedListing.amount - (selectedListing.collectedAmount || 0)}</span>
                        </div>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 font-bold text-muted-foreground">₹</span>
                            <Input 
                                type="number" 
                                value={contributionAmount} 
                                onChange={(e) => setContributionAmount(e.target.value)}
                                className="pl-8"
                                placeholder="Enter amount"
                            />
                        </div>
                    </div>
                </div>
              ) : (
                <p className="mb-2">
                    You are about to {selectedListing?.type === 'request' ? 'provide cash to' : 'receive cash from'} <strong>{selectedListing?.posterName}</strong>.
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm bg-muted p-2 rounded mt-4">
                  <span>📍 {selectedListing?.meetingLocation}</span>
                  <span>⏰ {selectedListing?.meetingTime}</span>
              </div>

            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)} disabled={isProcessing}>Cancel</Button>
            <Button onClick={handleConfirmAction} disabled={isProcessing} className="bg-secondary-neon text-primary-foreground">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : (selectedListing?.type === 'group-contribution' ? "Pay & Join" : "Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashExchangeListings;