"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, NotebookPen, Bike, PlusCircle } from "lucide-react";
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

const dummyErrands: ErrandPost[] = [
  { id: "e1", title: "Note-taking for CS101 Lecture", description: "Need someone to take detailed notes for CS101 lectures on Tuesdays and Thursdays.", type: "Note-writing/Transcription", compensation: "₹100/lecture", contact: "studentA@example.com", datePosted: "2024-07-22" },
  { id: "e2", title: "Help moving books to new hostel room", description: "Require assistance moving 3 boxes of books from old hostel to new room. Should take about an hour.", type: "Small Job (e.g., moving books)", compensation: "Lunch + ₹50", contact: "studentB@example.com", datePosted: "2024-07-21" },
];

const ErrandsPage = () => {
  const [isPostErrandDialogOpen, setIsPostErrandDialogOpen] = useState(false);
  const [postedErrands, setPostedErrands] = useState<ErrandPost[]>(dummyErrands);

  const handleErrandClick = (errandType: string) => {
    toast.info(`You selected "${errandType}". Feature coming soon!`);
    // In a real app, this would navigate to a form to post an errand.
  };

  const handlePostErrand = (data: Omit<ErrandPost, "id" | "datePosted">) => {
    const newErrand: ErrandPost = {
      ...data,
      id: `e${postedErrands.length + 1}`,
      datePosted: new Date().toISOString().split('T')[0],
    };
    setPostedErrands((prev) => [newErrand, ...prev]);
    toast.success(`Your errand "${newErrand.title}" has been posted!`);
    setIsPostErrandDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Errands</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-secondary-neon" /> Campus Errands
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Need a helping hand with small tasks? Post your errand here!
            </p>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleErrandClick("Note-writing/Transcription")}
            >
              <NotebookPen className="mr-2 h-4 w-4" /> Note-writing/Transcription
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleErrandClick("Small Jobs (e.g., moving books)")}
            >
              <Bike className="mr-2 h-4 w-4" /> Small Jobs (e.g., moving books)
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleErrandClick("Delivery Services (within campus)")}
            >
              <Bike className="mr-2 h-4 w-4" /> Delivery Services (within campus)
            </Button>
            <Dialog open={isPostErrandDialogOpen} onOpenChange={setIsPostErrandDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post Your Errand
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Campus Errand</DialogTitle>
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
            <CardTitle className="text-xl font-semibold text-card-foreground">Recently Posted Errands</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {postedErrands.length > 0 ? (
              postedErrands.map((errand) => (
                <div key={errand.id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground">{errand.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{errand.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Type: <span className="font-medium text-foreground">{errand.type}</span></p>
                  <p className="text-xs text-muted-foreground">Compensation: <span className="font-medium text-foreground">{errand.compensation}</span></p>
                  {errand.deadline && <p className="text-xs text-muted-foreground">Deadline: <span className="font-medium text-foreground">{errand.deadline}</span></p>}
                  <p className="text-xs text-muted-foreground">Contact: <span className="font-medium text-foreground">{errand.contact}</span></p>
                  <p className="text-xs text-muted-foreground">Posted: {errand.datePosted}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No errands posted yet. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ErrandsPage;