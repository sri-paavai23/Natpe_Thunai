"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Handshake, PlusCircle, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CASH_EXCHANGE_COLLECTION_ID } from "@/lib/appwrite";
import { ID, Models, Query } from "appwrite";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { calculateCommissionRate, formatCommissionRate } from "@/utils/commission"; // Import dynamic commission

interface Contribution {
  userId: string;
  amount: number;
}

interface CashExchangeRequest extends Models.Document {
  type: "request" | "offer" | "group-contribution";
  amount: number;
  commission: number;
  notes: string;
  status: "Open" | "Accepted" | "Completed" | "Group Contribution";
  meetingLocation: string;
  meetingTime: string;
  contributions?: Contribution[];
  posterId: string; // ID of the user who posted the request/offer
  posterName: string; // Name of the user who posted
  collegeName: string; // NEW: Add collegeName
}

const CashExchangePage = () => {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"requests" | "offers" | "group-contributions">("requests");
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [postType, setPostType] = useState<"request" | "offer" | "group-contribution">("request");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [exchangeRequests, setExchangeRequests] = useState<CashExchangeRequest[]>([]);
  const [isPosting, setIsPosting] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!userProfile?.collegeName) { // NEW: Only fetch if collegeName is available
      setLoading(false);
      setExchangeRequests([]); // Clear requests if no college is set
      return;
    }

    setLoading(true);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_CASH_EXCHANGE_COLLECTION_ID,
        [
          Query.orderDesc('$createdAt'),
          Query.equal('collegeName', userProfile.collegeName) // NEW: Filter by collegeName
        ]
      );
      setExchangeRequests(response.documents as unknown as CashExchangeRequest[]);
    } catch (error) {
      console.error("Error fetching cash exchange data:", error);
      toast.error("Failed to load cash exchange listings.");
    } finally {
      setLoading(false);
    }
  }, [userProfile?.collegeName]); // NEW: Depend on userProfile.collegeName

  useEffect(() => {
    fetchRequests();

    if (!userProfile?.collegeName) return; // NEW: Only subscribe if collegeName is available

    const unsubscribe = databases.client.subscribe(
      `databases.${APPWRITE_DATABASE_ID}.collections.${APPWRITE_CASH_EXCHANGE_COLLECTION_ID}.documents`,
      (response) => {
        const payload = response.payload as unknown as CashExchangeRequest;

        // NEW: Filter real-time updates by collegeName
        if (payload.collegeName !== userProfile.collegeName) {
            return;
        }

        setExchangeRequests(prev => {
          const existingIndex = prev.findIndex(r => r.$id === payload.$id);

          if (response.events.includes("databases.*.collections.*.documents.*.create")) {
            if (existingIndex === -1) {
              toast.info(`New cash exchange post: ${payload.type} for ₹${payload.amount}`);
              return [payload, ...prev];
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.update")) {
            if (existingIndex !== -1) {
              toast.info(`Cash exchange updated: ${payload.type} status is now ${payload.status}`);
              return prev.map(r => r.$id === payload.$id ? payload : r);
            }
          } else if (response.events.includes("databases.*.collections.*.documents.*.delete")) {
            if (existingIndex !== -1) {
              toast.info(`Cash exchange post removed.`);
              return prev.filter(r => r.$id !== payload.$id);
            }
          }
          return prev;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [fetchRequests, userProfile?.collegeName]); // NEW: Depend on userProfile.collegeName


  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Added explicit check for user.$id
    if (!user || !user.$id || !userProfile || !userProfile.collegeName) {
      toast.error("You must be logged in with a complete profile to post.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (!notes.trim() || !meetingLocation.trim() || !meetingTime.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsPosting(true);
    try {
      // Commission is now 0 for cash exchange
      const commissionAmount = 0; 

      const newRequestData = {
        type: postType,
        amount: parsedAmount,
        commission: commissionAmount, // Set commission to 0
        notes: notes.trim(),
        status: postType === "group-contribution" ? "Group Contribution" : "Open",
        meetingLocation: meetingLocation.trim(),
        meetingTime: meetingTime.trim(),
        contributions: postType === "group-contribution" ? [] : undefined,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName, // NEW: Add collegeName
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CASH_EXCHANGE_COLLECTION_ID,
        ID.unique(),
        newRequestData
      );

      toast.success(`Your ${postType.replace('-', ' ')} for ₹${parsedAmount} has been posted!`);
      setIsPostDialogOpen(false);
      setAmount("");
      setNotes("");
      setMeetingLocation("");
      setMeetingTime("");
      setActiveTab(postType === "offer" ? "offers" : (postType === "group-contribution" ? "group-contributions" : "requests"));
    } catch (error: any) {
      console.error("Error posting cash exchange:", error);
      toast.error(error.message || "Failed to post cash exchange request.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleAcceptDeal = async (request: CashExchangeRequest) => {
    // Added explicit check for user.$id
    if (!user || !user.$id) {
      toast.error("You must be logged in to accept a deal.");
      return;
    }
    if (request.posterId === user.$id) {
      toast.error("You cannot accept your own deal.");
      return;
    }
    if (request.status !== "Open") {
      toast.error("This deal is no longer open.");
      return;
    }

    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CASH_EXCHANGE_COLLECTION_ID,
        request.$id,
        { status: "Accepted" }
      );
      toast.success(`Deal accepted for ${request.type} of ₹${request.amount}! Please arrange meeting.`);
    } catch (error: any) {
      console.error("Error accepting deal:", error);
      toast.error(error.message || "Failed to accept deal.");
    }
  };

  const handleContribute = async (request: CashExchangeRequest) => {
    // Added explicit check for user.$id
    if (!user || !user.$id) {
      toast.error("You must be logged in to contribute.");
      return;
    }
    if (request.posterId === user.$id) {
      toast.error("You cannot contribute to your own request.");
      return;
    }
    if (request.status !== "Group Contribution") {
      toast.error("This is not an active group contribution request.");
      return;
    }

    const contributionAmount = 500; // Example fixed contribution amount
    const currentContribution = request.contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;
    const remainingAmount = request.amount - currentContribution;

    if (remainingAmount <= 0) {
      toast.error("This group contribution is already fully funded.");
      return;
    }
    
    const actualContribution = Math.min(contributionAmount, remainingAmount);
    
    // Check if user already contributed (optional, but good practice)
    if (request.contributions?.some(c => c.userId === user.$id)) {
        toast.warning("You have already contributed to this request.");
        // For simplicity, we allow multiple contributions until fully funded, but warn.
    }

    const newContributions: Contribution[] = [
      ...(request.contributions || []),
      { userId: user.$id, amount: actualContribution }
    ];

    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CASH_EXCHANGE_COLLECTION_ID,
        request.$id,
        { contributions: newContributions }
      );
      toast.success(`You contributed ₹${actualContribution} to this request!`);
    } catch (error: any) {
      console.error("Error contributing:", error);
      toast.error(error.message || "Failed to record contribution.");
    }
  };

  const renderListings = (type: CashExchangeRequest["type"]) => {
    const filteredRequests = exchangeRequests.filter(r => r.type === type);

    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
          <p className="ml-3 text-muted-foreground">Loading listings...</p>
        </div>
      );
    }

    if (filteredRequests.length === 0) {
      return <p className="text-center text-muted-foreground py-4">No {type.replace('-', ' ')} posts yet for your college.</p>;
    }

    return filteredRequests.map((req) => {
      const isPoster = req.posterId === user?.$id;
      const currentContribution = req.contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;
      const remainingAmount = req.amount - currentContribution;

      return (
        <div key={req.$id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border border-border rounded-md bg-background">
          <div>
            <p className="font-semibold text-foreground">
              ₹{req.amount} 
              <Badge className={cn("ml-2", 
                req.type === "request" && "bg-blue-500 text-white",
                req.type === "offer" && "bg-green-500 text-white",
                req.type === "group-contribution" && "bg-purple-500 text-white"
              )}>
                {req.type === "group-contribution" ? "Group" : req.type.charAt(0).toUpperCase() + req.type.slice(1)}
              </Badge>
            </p>
            <p className="text-sm text-muted-foreground">{req.notes}</p>
            {/* Removed commission display as it's now 0 */}
            <p className="text-xs text-muted-foreground">Poster: {isPoster ? "You" : req.posterName}</p>
            {req.meetingLocation && <p className="text-xs text-muted-foreground">Meet: {req.meetingLocation} at {req.meetingTime}</p>}
            
            {req.type === "group-contribution" && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Users className="h-3 w-3" /> Contributed: ₹{currentContribution} / ₹{req.amount}
              </p>
            )}
          </div>
          
          {/* Action Buttons */}
          {req.status === "Open" && !isPoster && (
            <Button size="sm" className="mt-2 sm:mt-0 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" onClick={() => handleAcceptDeal(req)}>
              Accept Deal
            </Button>
          )}
          {req.status === "Group Contribution" && !isPoster && remainingAmount > 0 && (
            <Button size="sm" className="mt-2 sm:mt-0 bg-blue-500 text-white hover:bg-blue-600" onClick={() => handleContribute(req)}>
              Contribute (₹500)
            </Button>
          )}
          {req.status !== "Open" && req.status !== "Group Contribution" && (
            <Badge className={cn("mt-2 sm:mt-0", req.status === "Accepted" ? "bg-orange-500 text-white" : "bg-green-500 text-white")}>
              {req.status}
            </Badge>
          )}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Cash Exchange</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-secondary-neon" /> Your Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Post your cash requirements or offers for your college. This is a non-commissioned service. If you are benefited, consider contributing to the developers.
            </p>
            <Button
              className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
              onClick={() => setIsPostDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Post New Request/Offer
            </Button>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "requests" | "offers" | "group-contributions")} className="w-full">
          <TabsList className="flex w-full overflow-x-auto whitespace-nowrap bg-primary-blue-light text-primary-foreground h-auto p-1 rounded-md shadow-sm scrollbar-hide">
            <TabsTrigger value="requests" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Requests</TabsTrigger>
            <TabsTrigger value="offers" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Offers</TabsTrigger>
            <TabsTrigger value="group-contributions" className="flex-shrink-0 px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm">Group</TabsTrigger>
          </TabsList>
          <div className="mt-4 space-y-4">
            <TabsContent value="requests">
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  {renderListings("request")}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="offers">
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  {renderListings("offer")}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="group-contributions">
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  {renderListings("group-contribution")}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
      <MadeWithDyad />

      {/* Post Request/Offer Dialog */}
      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Post New Cash Exchange</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePostSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
              <Label htmlFor="postType" className="text-left sm:text-right text-foreground">
                Type
              </Label>
              <div className="col-span-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={postType === "request" ? "default" : "outline"}
                  onClick={() => setPostType("request")}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground text-xs"
                >
                  Request Cash
                </Button>
                <Button
                  type="button"
                  variant={postType === "offer" ? "default" : "outline"}
                  onClick={() => setPostType("offer")}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground text-xs"
                >
                  Offer Cash
                </Button>
                <Button
                  type="button"
                  variant={postType === "group-contribution" ? "default" : "outline"}
                  onClick={() => setPostType("group-contribution")}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground text-xs"
                >
                  Group Contribution
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
              <Label htmlFor="amount" className="text-left sm:text-right text-foreground">
                Amount (₹)
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                placeholder="e.g., 1000"
                min="1"
                required
                disabled={isPosting}
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
              <Label htmlFor="notes" className="text-left sm:text-right text-foreground">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                placeholder="e.g., Need cash for books by tomorrow."
                required
                disabled={isPosting}
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
              <Label htmlFor="meetingLocation" className="text-left sm:text-right text-foreground">
                Meeting Location
              </Label>
              <Input
                id="meetingLocation"
                type="text"
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
                className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                placeholder="e.g., Library Entrance, Canteen"
                required
                disabled={isPosting}
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
              <Label htmlFor="meetingTime" className="text-left sm:text-right text-foreground">
                Meeting Time
              </Label>
              <Input
                id="meetingTime"
                type="text"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                placeholder="e.g., Tomorrow 3 PM, Today 1 PM"
                required
                disabled={isPosting}
              />
            </div>
            <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setIsPostDialogOpen(false)} disabled={isPosting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">Cancel</Button>
              <Button type="submit" disabled={isPosting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Post
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashExchangePage;