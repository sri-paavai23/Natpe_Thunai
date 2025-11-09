"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Edit, Video, PenTool, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostServiceForm from "@/components/forms/PostServiceForm"; // Import the new form

interface ServicePost {
  id: string;
  title: string;
  description: string;
  category: string;
  price: string;
  contact: string;
  datePosted: string;
}

const dummyFreelanceServices: ServicePost[] = [
  { id: "fs1", title: "Resume & Cover Letter Writing", description: "Crafting professional resumes and cover letters to help you land your dream job.", category: "Resume Building", price: "₹300-₹800", contact: "writer@example.com", datePosted: "2024-07-20" },
  { id: "fs2", title: "Basic Video Editing", description: "Editing short videos for projects, social media, or personal use.", category: "Video Editing", price: "₹200/min", contact: "editor@example.com", datePosted: "2024-07-18" },
];

const FreelancePage = () => {
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);
  const [postedServices, setPostedServices] = useState<ServicePost[]>(dummyFreelanceServices);

  const handleServiceClick = (serviceName: string) => {
    toast.info(`You selected "${serviceName}". Feature coming soon!`);
    // In a real app, this would navigate to a service detail page or a booking form.
  };

  const handlePostService = (data: Omit<ServicePost, "id" | "datePosted">) => {
    const newService: ServicePost = {
      ...data,
      id: `fs${postedServices.length + 1}`,
      datePosted: new Date().toISOString().split('T')[0],
    };
    setPostedServices((prev) => [newService, ...prev]);
    toast.success(`Your service "${newService.title}" has been posted!`);
    setIsPostServiceDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Freelance Section</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-secondary-neon" /> Available Services
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Find and offer various freelance services within the campus community.
            </p>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleServiceClick("Resume Building")}
            >
              <Edit className="mr-2 h-4 w-4" /> Resume Building
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleServiceClick("Video Editing")}
            >
              <Video className="mr-2 h-4 w-4" /> Video Editing
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleServiceClick("Content Writing")}
            >
              <PenTool className="mr-2 h-4 w-4" /> Content Writing
            </Button>
            <Button
              className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => handleServiceClick("Graphic Design")}
            >
              <PenTool className="mr-2 h-4 w-4" /> Graphic Design
            </Button>
            <Dialog open={isPostServiceDialogOpen} onOpenChange={setIsPostServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post Your Service
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Freelance Service</DialogTitle>
                </DialogHeader>
                <PostServiceForm onSubmit={handlePostService} onCancel={() => setIsPostServiceDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Recently Posted Services</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {postedServices.length > 0 ? (
              postedServices.map((service) => (
                <div key={service.id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground">{service.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Category: <span className="font-medium text-foreground">{service.category}</span></p>
                  <p className="text-xs text-muted-foreground">Price: <span className="font-medium text-foreground">{service.price}</span></p>
                  <p className="text-xs text-muted-foreground">Contact: <span className="font-medium text-foreground">{service.contact}</span></p>
                  <p className="text-xs text-muted-foreground">Posted: {service.datePosted}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No services posted yet. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default FreelancePage;