"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, PlusCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface ProjectPost {
  id: string;
  title: string;
  description: string;
  skillsNeeded: string;
  contact: string;
  datePosted: string;
}

const dummyProjectPosts: ProjectPost[] = [
  { id: "p1", title: "React Native App for Event Management", description: "Looking for a mobile developer to help build a campus event app.", skillsNeeded: "React Native, Firebase", contact: "dev.team@example.com", datePosted: "2024-07-20" },
  { id: "p2", title: "Research Assistant for AI Ethics", description: "Need help with literature review and data analysis for an AI ethics paper.", skillsNeeded: "Research, Python, Ethics", contact: "prof.smith@example.com", datePosted: "2024-07-18" },
];

const CollaboratorsPage = () => {
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [postSkills, setPostSkills] = useState("");
  const [postContact, setPostContact] = useState("");

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle || !postDescription || !postSkills || !postContact) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const newPost: ProjectPost = {
      id: `p${dummyProjectPosts.length + 1}`,
      title: postTitle,
      description: postDescription,
      skillsNeeded: postSkills,
      contact: postContact,
      datePosted: new Date().toISOString().split('T')[0],
    };
    dummyProjectPosts.unshift(newPost); // Add to the beginning for visibility
    toast.success(`Your project "${newPost.title}" has been posted!`);
    setIsPostDialogOpen(false);
    setPostTitle("");
    setPostDescription("");
    setPostSkills("");
    setPostContact("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Project Collaborator Tab</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary-neon" /> Find Collaborators
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Post your project needs or browse for exciting collaboration opportunities.
            </p>
            <Button
              className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
              onClick={() => setIsPostDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Post a Project
            </Button>
            <Button
              variant="outline"
              className="w-full border-secondary-neon text-secondary-neon hover:bg-secondary-neon/10"
              onClick={() => toast.info("Searching for projects (feature coming soon)!")}
            >
              <Search className="mr-2 h-4 w-4" /> Browse Projects
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Recent Project Posts</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {dummyProjectPosts.length > 0 ? (
              dummyProjectPosts.map((post) => (
                <div key={post.id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground">{post.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{post.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Skills: <span className="font-medium text-foreground">{post.skillsNeeded}</span></p>
                  <p className="text-xs text-muted-foreground">Contact: <span className="font-medium text-foreground">{post.contact}</span></p>
                  <p className="text-xs text-muted-foreground">Posted: {post.datePosted}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No project posts yet. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />

      {/* Post Project Dialog */}
      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Post New Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePostSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
              <Label htmlFor="postTitle" className="text-left sm:text-right text-foreground">
                Title
              </Label>
              <Input
                id="postTitle"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                placeholder="e.g., AI Research Project"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
              <Label htmlFor="postDescription" className="text-left sm:text-right text-foreground">
                Description
              </Label>
              <Textarea
                id="postDescription"
                value={postDescription}
                onChange={(e) => setPostDescription(e.target.value)}
                className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                placeholder="Briefly describe your project and what you need help with."
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
              <Label htmlFor="postSkills" className="text-left sm:text-right text-foreground">
                Skills Needed
              </Label>
              <Input
                id="postSkills"
                value={postSkills}
                onChange={(e) => setPostSkills(e.target.value)}
                className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                placeholder="e.g., Python, Data Analysis, UI/UX"
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
              <Label htmlFor="postContact" className="text-left sm:text-right text-foreground">
                Contact Email
              </Label>
              <Input
                id="postContact"
                type="email"
                value={postContact}
                onChange={(e) => setPostContact(e.target.value)}
                className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                placeholder="your.email@example.com"
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsPostDialogOpen(false)} className="border-border text-primary-foreground hover:bg-muted">Cancel</Button>
              <Button type="submit" className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">Post Project</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollaboratorsPage;