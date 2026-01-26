"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Added for navigation
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  ShoppingBag, NotebookPen, Bike, PlusCircle, Loader2, X, 
  MapPin, Clock, Wallet, Phone, Lock, Handshake, CheckCircle, ArrowRight,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import PostErrandForm from "@/components/forms/PostErrandForm";
import { useErrandListings } from "@/hooks/useErrandListings";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_ERRANDS_COLLECTION_ID, APPWRITE_TRANSACTIONS_COLLECTION_ID } from "@/lib/appwrite";
import { ID, Query } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import * as z from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

// --- CONFIGURATION ---
const ERRAND_TYPES = ["note-writing", "small-job", "delivery"];

const STANDARD_ERRAND_OPTIONS = [
  { value: "note-writing", label: "Note-writing/Transcription" },
  { value: "small-job", label: "Small Job (e.g., moving books)" },
  { value: "delivery", label: "Delivery Services (within campus)" },
  { value: "other", label: "Other" },
];

const ErrandFormSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  type: z.string().min(1, { message: "Please select an errand type." }),
  otherTypeDescription: z.string().optional(),
  compensation: z.string().min(2, { message: "Compensation details are required." }),
  deadline: z.date().optional(),
  contact: z.string().min(5, { message: "Contact information is required." }),
});

// --- SUB-COMPONENT: Errand Card ---
const ErrandCard = ({ errand, currentUser }: { errand: any, currentUser: any }) => {
  const navigate = useNavigate();
  const [isAccepted, setIsAccepted] = useState(false); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  const isOwner = currentUser?.$id === errand.posterId;
  const compensationDisplay = errand.compensation;

  /**
   * ENHANCEMENT: PERSISTENCE CHECK
   * On mount, check if this user has already 'locked' this errand.
   * This prevents the "button reappearing after refresh" issue.
   */
  useEffect(() => {
    const checkDealStatus = async () => {
      if (!currentUser || isOwner) {
        setIsCheckingStatus(false);
        return;
      }
      try {
        const existing = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          APPWRITE_TRANSACTIONS_COLLECTION_ID,
          [
            Query.equal('productId', errand.$id),
            Query.equal('buyerId', currentUser.$id)
          ]
        );
        if (existing.documents.length > 0) {
          setIsAccepted(true);
        }
      } catch (e) {
        console.error("Status check failed", e);
      } finally {
        setIsCheckingStatus(false);
      }
    };
    checkDealStatus();
  }, [errand.$id, currentUser, isOwner]);

  const handleAcceptErrand = async () => {
    if (!currentUser) {
      toast.error("Please log in to accept errands.");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Create a Transaction Record (This "Locks" the deal)
      // Amount is 0 because errands are usually cash/direct settlement or handled in Tracking
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_TRANSACTIONS_COLLECTION_ID,
        ID.unique(),
        {
          productId: errand.$id,
          productTitle: `Errand: ${errand.title}`,
          amount: 0, 
          buyerId: currentUser.$id, 
          buyerName: currentUser.name,
          sellerId: errand.posterId, 
          sellerName: errand.posterName,
          collegeName: errand.collegeName,
          status: "initiated", 
          type: "errand", 
          ambassadorDelivery: false, 
          ambassadorMessage: `Task: ${errand.description} | Reward: ${errand.compensation}` 
        }
      );

      setIsAccepted(true);
      setIsConfirmOpen(false);
      toast.success("Hustle Mode: ON! Deal locked.");
      
      // 2. NAVIGATE TO TRACKING PAGE IMMEDIATELY
      navigate("/tracking"); 
      
    } catch (error: any) {
      toast.error("Failed to lock this deal.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isCheckingStatus) {
    return <Card className="h-48 animate-pulse bg-muted/20 border-border" />;
  }

  return (
    <Card className="group relative overflow-hidden border border-border/60 hover:border-secondary-neon/50 transition-all duration-300 hover:shadow-lg bg-card">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-secondary-neon/20">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${errand.posterName}`} />
              <AvatarFallback>{errand.posterName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg font-bold text-foreground leading-tight">{errand.title}</CardTitle>
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <span>{errand.posterName}</span>
                <span>•</span>
                <span>{new Date(errand.$createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="capitalize bg-secondary/10 text-secondary-neon border-secondary-neon/20">
            {errand.type}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3 bg-muted/30 p-3 rounded-md italic leading-relaxed">
          "{errand.description}"
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2 text-foreground/80">
            <Wallet className="h-4 w-4 text-green-500" />
            <span className="font-semibold">{compensationDisplay}</span>
          </div>
          {errand.deadline && (
            <div className="flex items-center gap-2 text-foreground/80">
              <Clock className="h-4 w-4 text-amber-500" />
              <span>{new Date(errand.deadline).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        {isOwner ? (
          <Button variant="outline" className="w-full cursor-default opacity-80 border-dashed" disabled>
            <CheckCircle className="mr-2 h-4 w-4" /> This is your gig
          </Button>
        ) : isAccepted ? (
          <Button 
            onClick={() => navigate("/tracking")}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold gap-2 animate-in fade-in slide-in-from-bottom-2"
          >
            <Activity className="h-4 w-4" /> JUMP TO ACTIVITY LOG
          </Button>
        ) : (
          <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 font-black tracking-tight shadow-lg shadow-secondary-neon/20 transition-transform active:scale-95">
                LET'S HUSTLE <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] bg-card border-secondary-neon/30">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 italic">
                  <Lock className="h-5 w-5 text-secondary-neon" /> LOCK THIS DEAL?
                </DialogTitle>
                <DialogDescription className="pt-4 text-foreground/80">
                  By accepting, you commit to helping <b>{errand.posterName}</b>. 
                  <br/><br/>
                  A private card will be created in your <b>Activity Log</b> where you can chat and verify the task completion.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsConfirmOpen(false)} className="rounded-xl">Wait, go back</Button>
                <Button onClick={handleAcceptErrand} disabled={isProcessing} className="bg-secondary-neon text-primary-foreground font-bold rounded-xl px-6">
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : "CONFIRM & TRACK"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardFooter>
    </Card>
  );
};

// --- MAIN PAGE COMPONENT ---
const ErrandsPage = () => {
  const { user, userProfile } = useAuth();
  const [isPostErrandDialogOpen, setIsPostErrandDialogOpen] = useState(false);
  const [preselectedErrandType, setPreselectedErrandType] = useState<string | undefined>(undefined);
  const [showErrandFormInfoAlert, setShowErrandFormInfoAlert] = useState(true);
  
  const { errands: postedErrands, isLoading, error } = useErrandListings(ERRAND_TYPES);
  const isAgeGated = (userProfile?.age ?? 0) >= 25; 

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleErrandClick = (errandType: string) => {
    setPreselectedErrandType(errandType);
    setIsPostErrandDialogOpen(true);
    setShowErrandFormInfoAlert(true);
  };

  const handlePostErrand = async (data: z.infer<typeof ErrandFormSchema>) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post an errand.");
      return;
    }

    try {
      const newErrandData = {
        ...data,
        type: data.type === 'other' && data.otherTypeDescription 
              ? data.otherTypeDescription 
              : data.type,
        deadline: data.deadline ? data.deadline.toISOString() : null,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName,
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_ERRANDS_COLLECTION_ID,
        ID.unique(),
        newErrandData
      );
      
      toast.success(`Your errand "${data.title}" has been posted!`);
      setIsPostErrandDialogOpen(false);
      setPreselectedErrandType(undefined);
    } catch (e: any) {
      toast.error(e.message || "Failed to post errand listing.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-24 relative overflow-x-hidden">
      
      <div className="max-w-md mx-auto mb-8">
        <h1 className="text-4xl font-black italic tracking-tighter text-foreground uppercase">
          Campus<span className="text-secondary-neon">Gigs</span>
        </h1>
        <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-widest opacity-70">
          Fast cash. Fast help.
        </p>
      </div>
      
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* POSTING SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 md:col-span-3 bg-gradient-to-br from-card to-secondary/10 border-border shadow-sm overflow-hidden">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl font-black">
                        <PlusCircle className="h-6 w-6 text-secondary-neon" /> POST A TASK
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <Button variant="outline" className="h-auto py-5 flex flex-col gap-2 border-border/40 hover:border-secondary-neon/50 bg-background/50" onClick={() => handleErrandClick("note-writing")}>
                        <NotebookPen className="h-6 w-6 text-blue-500" />
                        <span className="text-[10px] font-black uppercase">Writing</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-5 flex flex-col gap-2 border-border/40 hover:border-secondary-neon/50 bg-background/50" onClick={() => handleErrandClick("small-job")}>
                        <ShoppingBag className="h-6 w-6 text-purple-500" />
                        <span className="text-[10px] font-black uppercase">Small Jobs</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-5 flex flex-col gap-2 border-border/40 hover:border-secondary-neon/50 bg-background/50" onClick={() => handleErrandClick("delivery")}>
                        <Bike className="h-6 w-6 text-orange-500" />
                        <span className="text-[10px] font-black uppercase">Delivery</span>
                    </Button>
                    
                    <Dialog open={isPostErrandDialogOpen} onOpenChange={setIsPostErrandDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-auto py-5 flex flex-col gap-2 bg-secondary-neon text-primary-foreground font-black shadow-neon" disabled={isAgeGated}>
                                <Activity className="h-6 w-6" />
                                <span className="text-[10px] uppercase">Custom Post</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95%] sm:max-w-[425px] bg-card text-card-foreground border-border max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="font-black italic">POST NEW GIG</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                                {showErrandFormInfoAlert && (
                                    <Alert className="bg-secondary-neon/10 border-secondary-neon/20 text-secondary-neon">
                                    <AlertDescription className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter">
                                        <span>Details matter. Compensation is cash/direct.</span>
                                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setShowErrandFormInfoAlert(false)}><X className="h-3 w-3" /></Button>
                                    </AlertDescription>
                                    </Alert>
                                )}
                                <PostErrandForm 
                                    onSubmit={handlePostErrand} 
                                    onCancel={() => { setIsPostErrandDialogOpen(false); setPreselectedErrandType(undefined); }} 
                                    typeOptions={STANDARD_ERRAND_OPTIONS}
                                    initialType={preselectedErrandType}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </div>

        {/* LISTINGS SECTION */}
        <div className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-muted-foreground">
                <span className="bg-secondary-neon w-8 h-0.5 rounded-full"></span>
                ACTIVE BOUNTIES
            </h2>
            
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="h-48 animate-pulse bg-muted/20 border-border" />
                    ))}
                </div>
            ) : postedErrands.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {postedErrands.map((errand) => (
                        <ErrandCard key={errand.$id} errand={errand} currentUser={user} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl opacity-60">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-sm font-black uppercase">No Bounties Available</h3>
                    <p className="text-xs text-muted-foreground mt-1">Be the campus hero everyone needs.</p>
                </div>
            )}
        </div>

      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ErrandsPage;