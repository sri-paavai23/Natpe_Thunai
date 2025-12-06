"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, PlusCircle, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCollaboratorPosts, CollaboratorPost } from "@/hooks/useCollaboratorPosts";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_COLLABORATORS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";

const CollaboratorsPage = () => {
  const { user, userProfile } = useAuth();
  const { posts: allProjectPosts, isLoading, error } = useCollaboratorPosts(); // Fetch all posts
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [postSkills, setPostSkills] = useState("");
  const [postContact, setPostContact] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // NEW: State for search term

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a project.");
      return;
    }
    if (!userProfile.collegeName) {
      toast.error("Your profile is missing college information. Please update your profile first.");
      return;
    }
    if (!postTitle || !postDescription || !postSkills || !postContact) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsPosting(true);
    try {
      const newPostData = {
        title: postTitle,
        description: postDescription,
        skillsNeeded: postSkills,
        contact: postContact,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName, // NEW: Add collegeName
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLABORATORS_COLLECTION_ID,
        ID.unique(),
        newPostData
      );

      toast.success(`Your project "${postTitle}" has been posted!`);
      setIsPostDialogOpen(false);
      setPostTitle("");
      setPostDescription("");
      setPostSkills("");
      setPostContact("");
    } catch (e: any) {
      console.error("Error posting collaborator project:", e);
      toast.error(e.message || "Failed to post project.");
    } finally {
      setIsPosting(false);
    }
  };

  // NEW: Filter posts based on search term
  const filteredPosts = allProjectPosts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.skillsNeeded.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.posterName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            {/* NEW: Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects by title, description, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Recent Project Posts</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading posts...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading posts: {error}</p>
            ) : filteredPosts.length > 0 ? ( // NEW: Render filtered posts
              filteredPosts.map((post) => (
                <div key={post.$id} className="p-3 border border-border rounded-md bg-background">
                  <h3 className="font-semibold text-foreground">{post.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{post.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Skills: <span className="font-medium text-foreground">{post.skillsNeeded}</span></p>
                  <p className="text-xs text-muted-foreground">Contact: <span className="font-medium text-foreground">{post.contact}</span></p>
                  <p className="text-xs text-muted-foreground">Posted by: {post.posterName}</p>
                  <p className="text-xs text-muted-foreground">Posted: {new Date(post.$createdAt).toLocaleDateString()}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No project posts found matching your search.</p>
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
                disabled={isPosting}
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
                disabled={isPosting}
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
                disabled={isPosting}
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
                disabled={isPosting}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsPostDialogOpen(false)} disabled={isPosting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">Cancel</Button>
              <Button type="submit" className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" disabled={isPosting}>
                {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Post Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CollaboratorsPage;