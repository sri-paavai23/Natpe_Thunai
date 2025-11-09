"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Zap, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostErrandForm from "@/components/forms/PostErrandForm"; // Import the new form

interface ErrandPost {
  id: string;
  title: string;
  description: string;
  type: string;
  compensation: string;
  deadline?: string;
  contact: string;
  datePosted: string;
}

const dummyUrgentRequests: ErrandPost[] = [
  { id: "st1", title: "Urgent: Laptop Charger Needed!", description: "My laptop charger broke, need a Type-C charger for a few hours ASAP.", type: "Instant Help", compensation: "₹50 + coffee", contact: "studentC@example.com", datePosted: "2024-07-23" },
  { id: "st2", title: "Emergency: Medicine Delivery", description: "Need paracetamol delivered to hostel room 404 within 30 minutes.", type: "Emergency Deliveries", compensation: "₹100", contact: "studentD@example.com", datePosted: "2024-07-23" },
];

const ShortTermNeedsPage = () => {
  const [isPostErrandDialogOpen, setIsPostErrandDialogOpen] = useState(false);
  const [postedUrgentRequests, setPostedUrgentRequests] = useState<ErrandPost[]>(dummyUrgentRequests);

  const handleNeedClick = (needType: string) => {
    toast.info(`You selected "${needType}". Feature coming soon!`);
    // In a real app, this would navigate to a form to post an urgent request.
  };

  const handlePostErrand = (data: Omit<ErrandPost, "id" | "datePosted">) => {
    const newRequest: ErrandPost = {
      ...data,
      id: `st${postedUrgentRequests.length + 1}`,
      datePosted: new Date().toISOString().split('T')[0],
    };
    setPostedUrgentRequests((prev) => [newRequest, ...prev]);
    toast.success(`Your urgent request "${newRequest.title}" has been posted!`);
    setIsPostErrandDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Short-Term Needs</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Clock className="h-5 w-5 text-secondary-neon" /> Urgent Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              For urgent tasks with extra charges. Get help when you need it most!
            </p>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleNeedClick("Instant Help")}
            >
              <Zap className="mr-2 h-4 w-4" /> Instant Help
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleNeedClick("Emergency Deliveries")}
            >
              <Zap className="mr-2 h-4 w-4" /> Emergency Deliveries
            </Button>
            <Dialog open={isPostErrandDialogOpen} onOpenChange={setIsPostErrandDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post Urgent Request
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Urgent Request</DialogTitle>
                </DialogHeader>
                <PostErrandForm onSubmit={handlePostErrand} onCancel={() => setIsPostErrandDialogOpen(false)} />
              </DialogContent>
            </Dialog>
            <p className="text-xs text-destructive-foreground mt-4">
              Note: This section is age-gated for users under 25.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Recently Posted Urgent Requests</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {postedUrgentRequests.length > 0 ? (
              postedUrgentRequests.map((request) => (
                <div key={request.id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground">{request.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Type: <span className="font-medium text-foreground">{request.type}</span></p>
                  <p className="text-xs text-muted-foreground">Compensation: <span className="font-medium text-foreground">{request.compensation}</span></p>
                  {request.deadline && <p className="text-xs text-muted-foreground">Deadline: <span className="font-medium text-foreground">{request.deadline}</span></p>}
                  <p className="text-xs text-muted-foreground">Contact: <span className="font-medium text-foreground">{request.contact}</span></p>
                  <p className="text-xs text-muted-foreground">Posted: {request.datePosted}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No urgent requests posted yet. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ShortTermNeedsPage;