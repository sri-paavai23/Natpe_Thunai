"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Handshake, PlusCircle, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface CashExchangeRequest {
  id: string;
  type: "request" | "offer" | "group-contribution"; // Added group-contribution type
  amount: number;
  commission: number;
  notes: string;
  status: "Open" | "Accepted" | "Completed" | "Group Contribution";
  date: string;
  meetingLocation?: string;
  meetingTime?: string;
  contributions?: { userId: string; amount: number }[];
}

const dummyRequests: CashExchangeRequest[] = [
  { id: "ce1", type: "request", amount: 1000, commission: 30, notes: "Need cash for books.", status: "Open", date: "2024-07-22", meetingLocation: "Library Entrance", meetingTime: "Tomorrow 3 PM" },
  { id: "ce2", type: "offer", amount: 500, commission: 15, notes: "Can provide cash instantly.", status: "Open", date: "2024-07-21", meetingLocation: "Canteen", meetingTime: "Today 1 PM" },
  { id: "ce3", type: "request", amount: 2000, commission: 60, notes: "Urgent need for hostel fees.", status: "Accepted", date: "2024-07-20", meetingLocation: "Hostel Block A Lobby", meetingTime: "Yesterday 6 PM" },
  { id: "ce4", type: "group-contribution", amount: 3000, commission: 90, notes: "Group contribution for project funds.", status: "Group Contribution", date: "2024-07-23", meetingLocation: "CS Dept. Lab", meetingTime: "Friday 10 AM", contributions: [{ userId: "user1", amount: 1000 }, { userId: "user2", amount: 500 }] },
];

const CashExchangePage = () => {
  const [activeTab, setActiveTab] = useState<"requests" | "offers" | "group-contributions">("requests"); // Updated activeTab options
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [postType, setPostType] = useState<"request" | "offer" | "group-contribution">("request"); // Updated postType options
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [meetingLocation, setMeetingLocation] = useState("");
  const [meetingTime, setMeetingTime] = useState("");

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (!notes.trim()) {
      toast.error("Please add some notes for your post.");
      return;
    }
    if (!meetingLocation.trim() || !meetingTime.trim()) {
      toast.error("Please specify meeting location and time.");
      return;
    }

    const newRequest: CashExchangeRequest = {
      id: `ce${dummyRequests.length + 1}`,
      type: postType,
      amount: parsedAmount,
      commission: parsedAmount * 0.03, // 3% commission for example
      notes: notes.trim(),
      status: postType === "group-contribution" ? "Group Contribution" : "Open", // Set status based on type
      date: new Date().toISOString().split('T')[0],
      meetingLocation: meetingLocation.trim(),
      meetingTime: meetingTime.trim(),
      contributions: postType === "group-contribution" ? [] : undefined, // Initialize contributions for group type
    };
    dummyRequests.unshift(newRequest); // Add to the beginning for visibility
    toast.success(`Your ${postType.replace('-', ' ')} for ₹${parsedAmount} has been posted!`);
    setIsPostDialogOpen(false);
    setAmount("");
    setNotes("");
    setMeetingLocation("");
    setMeetingTime("");
    setActiveTab(postType === "offer" ? "offers" : (postType === "group-contribution" ? "group-contributions" : "requests"));
  };

  const handleAcceptDeal = (id: string) => {
    const request = dummyRequests.find(r => r.id === id);
    if (request) {
      request.status = "Accepted";
      toast.success(`Deal accepted for ${request.type} of ₹${request.amount}!`);
      // In a real app, this would initiate a transaction process
    }
  };

  const handleContribute = (id: string, currentContribution: number) => {
    const request = dummyRequests.find(r => r.id === id);
    if (request && request.status === "Group Contribution") {
      const newContribution = 500; // Example fixed contribution amount
      const remaining = request.amount - currentContribution;
      if (remaining <= 0) {
        toast.error("This group contribution is already fully funded.");
        return;
      }
      const actualContribution = Math.min(newContribution, remaining);
      
      if (!request.contributions) {
        request.contributions = [];
      }
      request.contributions.push({ userId: "currentUser", amount: actualContribution }); // Simulate current user
      toast.success(`You contributed ₹${actualContribution} to this request!`);
      // In a real app, this would update the backend and notify the requestor
    }
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
              Post your cash requirements or offers. A 3% commission applies to successful exchanges.
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
          <TabsList className="grid w-full grid-cols-3 bg-primary-blue-light text-primary-foreground h-auto"> {/* Updated grid-cols */}
            <TabsTrigger value="requests" className="data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">My Requests</TabsTrigger>
            <TabsTrigger value="offers" className="data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">My Offers</TabsTrigger>
            <TabsTrigger value="group-contributions" className="data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground">Group Contributions</TabsTrigger> {/* New tab */}
          </TabsList>
          <div className="mt-4 space-y-4">
            <TabsContent value="requests">
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  {dummyRequests.filter(r => r.type === "request").length > 0 ? (
                    dummyRequests.filter(r => r.type === "request").map((req) => (
                      <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border border-border rounded-md bg-background">
                        <div>
                          <p className="font-semibold text-foreground">₹{req.amount} <Badge className="ml-2 bg-blue-500 text-white">Request</Badge></p>
                          <p className="text-sm text-muted-foreground">{req.notes}</p>
                          <p className="text-xs text-muted-foreground">Commission: ₹{req.commission.toFixed(2)}</p>
                          {req.meetingLocation && <p className="text-xs text-muted-foreground">Meet: {req.meetingLocation} at {req.meetingTime}</p>}
                        </div>
                        {req.status === "Open" ? (
                          <Button size="sm" className="mt-2 sm:mt-0 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" onClick={() => handleAcceptDeal(req.id)}>
                            Accept Deal
                          </Button>
                        ) : (
                          <Badge className="mt-2 sm:mt-0 bg-green-500 text-white">{req.status}</Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No cash requests posted yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="offers">
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  {dummyRequests.filter(r => r.type === "offer").length > 0 ? (
                    dummyRequests.filter(r => r.type === "offer").map((offer) => (
                      <div key={offer.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border border-border rounded-md bg-background">
                        <div>
                          <p className="font-semibold text-foreground">₹{offer.amount} <Badge className="ml-2 bg-green-500 text-white">Offer</Badge></p>
                          <p className="text-sm text-muted-foreground">{offer.notes}</p>
                          <p className="text-xs text-muted-foreground">Commission: ₹{offer.commission.toFixed(2)}</p>
                          {offer.meetingLocation && <p className="text-xs text-muted-foreground">Meet: {offer.meetingLocation} at {offer.meetingTime}</p>}
                        </div>
                        {offer.status === "Open" ? (
                          <Button size="sm" className="mt-2 sm:mt-0 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" onClick={() => handleAcceptDeal(offer.id)}>
                            Accept Deal
                          </Button>
                        ) : (
                          <Badge className="mt-2 sm:mt-0 bg-green-500 text-white">{offer.status}</Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No cash offers posted yet.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="group-contributions"> {/* New tab content */}
              <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  {dummyRequests.filter(r => r.type === "group-contribution").length > 0 ? (
                    dummyRequests.filter(r => r.type === "group-contribution").map((req) => {
                      const currentContribution = req.contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;
                      const remainingAmount = req.amount - currentContribution;
                      return (
                        <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border border-border rounded-md bg-background">
                          <div>
                            <p className="font-semibold text-foreground">₹{req.amount} <Badge className="ml-2 bg-purple-500 text-white">Group Contribution</Badge></p>
                            <p className="text-sm text-muted-foreground">{req.notes}</p>
                            <p className="text-xs text-muted-foreground">Commission: ₹{req.commission.toFixed(2)}</p>
                            {req.meetingLocation && <p className="text-xs text-muted-foreground">Meet: {req.meetingLocation} at {req.meetingTime}</p>}
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="h-3 w-3" /> Contributed: ₹{currentContribution} / ₹{req.amount}
                            </p>
                          </div>
                          {remainingAmount > 0 ? (
                            <Button size="sm" className="mt-2 sm:mt-0 bg-blue-500 text-white hover:bg-blue-600" onClick={() => handleContribute(req.id, currentContribution)}>
                              Contribute (₹500)
                            </Button>
                          ) : (
                            <Badge className="mt-2 sm:mt-0 bg-green-500 text-white">Fully Funded</Badge>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No group contribution requests posted yet.</p>
                  )}
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
              <div className="col-span-3 flex flex-wrap gap-2"> {/* Changed to flex-wrap for better mobile */}
                <Button
                  type="button"
                  variant={postType === "request" ? "default" : "outline"}
                  onClick={() => setPostType("request")}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground"
                >
                  Request Cash
                </Button>
                <Button
                  type="button"
                  variant={postType === "offer" ? "default" : "outline"}
                  onClick={() => setPostType("offer")}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground"
                >
                  Offer Cash
                </Button>
                <Button
                  type="button"
                  variant={postType === "group-contribution" ? "default" : "outline"}
                  onClick={() => setPostType("group-contribution")}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 data-[state=active]:bg-secondary-neon data-[state=active]:text-primary-foreground"
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
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsPostDialogOpen(false)} className="border-border text-primary-foreground hover:bg-muted">Cancel</Button>
              <Button type="submit" className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">Post</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashExchangePage;