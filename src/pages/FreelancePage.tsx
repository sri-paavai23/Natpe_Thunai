"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase, Edit, Video, PenTool, PlusCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostServiceForm from "@/components/forms/PostServiceForm"; // Import the new form
import { Link, useNavigate } from "react-router-dom"; // Import Link and useNavigate

// Define service categories and their icons
const serviceCategories = [
  { name: "Resume Building", icon: Edit, path: "/services/freelance/resume-building" },
  { name: "Video Editing", icon: Video, path: "/services/freelance/video-editing" },
  { name: "Content Writing", icon: PenTool, path: "/services/freelance/content-writing" },
  { name: "Graphic Design", icon: PenTool, path: "/services/freelance/graphic-design" },
];

const FreelancePage = () => {
  const navigate = useNavigate(); // Use useNavigate
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);

  // This function is now just a placeholder/helper since posting should ideally happen on the specific category page
  const handlePostService = () => {
    toast.info("Service/Job Request posted successfully! (Simulated)");
    setIsPostServiceDialogOpen(false);
  };
  
  const handlePostJobRequest = () => {
    navigate("/services/post-job");
  };

  const handleBrowseAllListings = () => { // NEW: Handler for "Browse All Listings"
    navigate("/services/freelance/all");
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Freelance Section</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-secondary-neon" /> Post or Browse Jobs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Offer your skills or post a job request for campus freelancers (Fungro/Upwork style).
            </p>
            
            {/* Button for Posting a Job Request (Seeking Help) */}
            <Button 
              className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
              onClick={handlePostJobRequest}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Post a Job Request (Seeking Help)
            </Button>

            {/* Button for Posting a Service Offering (Using a modal for 'Other' or generic posting) */}
            <Dialog open={isPostServiceDialogOpen} onOpenChange={setIsPostServiceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post a Service Offering
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Service Offering</DialogTitle>
                </DialogHeader>
                <PostServiceForm onSubmit={handlePostService} onCancel={() => setIsPostServiceDialogOpen(false)} />
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              className="w-full border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10"
              onClick={handleBrowseAllListings} // NEW: Use the new handler
            >
              <Search className="mr-2 h-4 w-4" /> Browse All Listings
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-secondary-neon" /> Browse by Category (Offer Services)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            {serviceCategories.map((item) => (
              <Button
                key={item.name}
                asChild
                className="w-full justify-start bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Link to={item.path}>
                  <item.icon className="mr-2 h-4 w-4" /> {item.name}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default FreelancePage;