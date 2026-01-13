"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Handshake, PlusCircle, Users, Loader2, Info, ArrowRightLeft, MapPin, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_CASH_EXCHANGE_COLLECTION_ID } from "@/lib/appwrite";
import { ID, Models, Query } from "appwrite";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import CashExchangeListings from "@/components/CashExchangeListings";
import DeletionInfoMessage from "@/components/DeletionInfoMessage";

interface CashExchangeRequest extends Models.Document {
  type: "request" | "offer" | "group-contribution";
  amount: number;
  notes: string;
  status: "Open" | "Accepted" | "Completed";
  meetingLocation: string;
  meetingTime: string;
  isUrgent: boolean;
  posterName: string;
  collegeName: string;
}

const CashExchangePage = () => {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"need_cash" | "have_cash" | "split_bill">("need_cash");
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exchangeRequests, setExchangeRequests] = useState<CashExchangeRequest[]>([]);
  
  // Form States
  const [postType, setPostType] = useState<"request" | "offer" | "group-contribution">("request");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  // Common Campus Locations
  const SAFE_SPOTS = ["Main Canteen", "Library Entrance", "Admin Block", "Hostel Gate", "Coffee Shop", "Sports Ground"];

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const fetchRequests = useCallback(async () => {
    if (!userProfile?.collegeName) return;
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        APPWRITE_CASH_EXCHANGE_COLLECTION_ID,
        [Query.orderDesc('$createdAt'), Query.equal('collegeName', userProfile.collegeName)]
      );
      setExchangeRequests(response.documents as unknown as CashExchangeRequest[]);
    } catch (e) { toast.error("Failed to load listings."); } 
    finally { setLoading(false); }
  }, [userProfile?.collegeName]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Login required."); return; }
    
    if (!amount || !location || !time) { toast.error("Please fill all fields."); return; }

    setIsPosting(true);
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_CASH_EXCHANGE_COLLECTION_ID,
        ID.unique(),
        {
          type: postType,
          amount: parseFloat(amount),
          notes: notes,
          status: "Open",
          meetingLocation: location,
          meetingTime: time,
          isUrgent: isUrgent,
          posterId: user.$id,
          posterName: user.name,
          collegeName: userProfile?.collegeName
        }
      );
      toast.success("Posted successfully!");
      setIsPostDialogOpen(false);
      fetchRequests();
      // Reset Form
      setAmount(""); setNotes(""); setLocation(""); setTime(""); setIsUrgent(false);
    } catch (e: any) { toast.error(e.message || "Failed to post."); } 
    finally { setIsPosting(false); }
  };

  const getFilteredListings = (tab: string) => {
    if (tab === "need_cash") return exchangeRequests.filter(r => r.type === "request");
    if (tab === "have_cash") return exchangeRequests.filter(r => r.type === "offer");
    return exchangeRequests.filter(r => r.type === "group-contribution");
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-24">
      <div className="max-w-xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-black italic tracking-tighter">
                CASH <span className="text-secondary-neon">POINT</span>
            </h1>
            <p className="text-sm text-muted-foreground">
                Safe P2P cash exchange within {userProfile?.collegeName || "campus"}.
            </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-3">
            <Card 
                className="bg-green-50/50 hover:bg-green-100/50 border-green-200 cursor-pointer transition-colors"
                onClick={() => { setPostType("offer"); setIsPostDialogOpen(true); }}
            >
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <div className="p-2 bg-green-100 rounded-full text-green-600"><DollarSign className="h-6 w-6"/></div>
                    <div>
                        <h3 className="font-bold text-green-900">I Have Cash</h3>
                        <p className="text-xs text-green-700">Give physical cash, get UPI.</p>
                    </div>
                </CardContent>
            </Card>
            <Card 
                className="bg-blue-50/50 hover:bg-blue-100/50 border-blue-200 cursor-pointer transition-colors"
                onClick={() => { setPostType("request"); setIsPostDialogOpen(true); }}
            >
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-full text-blue-600"><ArrowRightLeft className="h-6 w-6"/></div>
                    <div>
                        <h3 className="font-bold text-blue-900">I Need Cash</h3>
                        <p className="text-xs text-blue-700">Send UPI, get physical cash.</p>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Safety Banner */}
        <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-3 flex items-start gap-3 text-xs text-muted-foreground">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-secondary-neon" />
            <p>Exchange only in public campus spots (Canteen, Library). Never transfer money before meeting.</p>
        </div>

        {/* Listings Tabs */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
                <TabsTrigger value="need_cash" className="text-xs font-bold">Requests</TabsTrigger>
                <TabsTrigger value="have_cash" className="text-xs font-bold">Offers</TabsTrigger>
                <TabsTrigger value="split_bill" className="text-xs font-bold">Group Split</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
                <CashExchangeListings 
                    listings={getFilteredListings(activeTab)} 
                    isLoading={loading} 
                    type={activeTab === 'split_bill' ? 'group-contribution' : (activeTab === 'need_cash' ? 'request' : 'offer')} 
                />
            </TabsContent>
        </Tabs>

        {/* Post Dialog */}
        <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {postType === 'request' ? "Request Physical Cash" : postType === 'offer' ? "Offer Physical Cash" : "Create Group Pot"}
                    </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handlePostSubmit} className="space-y-4 py-2">
                    <DeletionInfoMessage />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Amount (₹)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                <Input 
                                    type="number" 
                                    placeholder="500" 
                                    className="pl-7" 
                                    value={amount} 
                                    onChange={(e) => setAmount(e.target.value)} 
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Time</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="e.g. 2 PM Today" 
                                    className="pl-9" 
                                    value={time} 
                                    onChange={(e) => setTime(e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Safe Meeting Spot</Label>
                        <Select value={location} onValueChange={setLocation}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a public location" />
                            </SelectTrigger>
                            <SelectContent>
                                {SAFE_SPOTS.map(spot => <SelectItem key={spot} value={spot}>{spot}</SelectItem>)}
                                <SelectItem value="other">Other (Public Spot)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes (Optional)</Label>
                        <Textarea 
                            placeholder="e.g. Need only ₹100 notes / GPay accepted" 
                            className="h-20 resize-none" 
                            value={notes} 
                            onChange={(e) => setNotes(e.target.value)} 
                        />
                    </div>

                    {postType === 'request' && (
                        <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <Label className="text-red-700 cursor-pointer" htmlFor="urgent-mode">Urgent Need?</Label>
                            </div>
                            <Switch id="urgent-mode" checked={isUrgent} onCheckedChange={setIsUrgent} />
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" className="w-full bg-secondary-neon font-bold text-primary-foreground" disabled={isPosting}>
                            {isPosting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post Listing"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

      </div>
      <MadeWithDyad />
    </div>
  );
};

export default CashExchangePage;