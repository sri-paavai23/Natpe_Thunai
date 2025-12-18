"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle, Users, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PostCollaboratorForm from "@/components/forms/PostCollaboratorForm"; // Assuming this component exists
import { useCollaboratorPosts, CollaboratorPost } from "@/hooks/useCollaboratorPosts";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CollaboratorsPage = () => {
  const { user, userProfile } = useAuth();
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  
  const { posts, isLoading, error, createPost, updatePostStatus } = useCollaboratorPosts();

  const isAgeGated = (userProfile?.age ?? 0) >= 25; 

  const handlePostCollaborator = async (data: Omit<CollaboratorPost, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$collectionId" | "$databaseId" | "posterId" | "posterName" | "collegeName" | "status">) => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a collaboration.");
      return;
    }

    try {
      await createPost(data);
      setIsPostDialogOpen(false);
    } catch (e: any) {
      console.error("Error posting collaboration:", e);
      toast.error(e.message || "Failed to post collaboration.");
    }
  };

  const getStatusBadgeClass = (status: CollaboratorPost["status"]) => {
    switch (status) {
      case "open":
        return "bg-green-500 text-white";
      case "filled":
        return "bg-blue-500 text-white";
      case "archived":
        return "bg-gray-500 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Collaborators Hub</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-secondary-neon" /> Find Collaborators
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Post your project ideas and find talented peers to collaborate with.
            </p>
            <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90 mt-4" disabled={isAgeGated}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Post Collaboration
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Post New Collaboration Opportunity</DialogTitle>
                </DialogHeader>
                <PostCollaboratorForm 
                  onSubmit={handlePostCollaborator} 
                  onCancel={() => setIsPostDialogOpen(false)} 
                  titlePlaceholder="e.g., Mobile App Development, Research Project"
                  descriptionPlaceholder="Describe your project, goals, and what you're looking for."
                  skillsNeededPlaceholder="e.g., React Native, UI/UX Design, Data Analysis (comma-separated)"
                  contactPlaceholder="e.g., Email, Discord ID"
                />
              </DialogContent>
            </Dialog>
            <p className="text-xs text-destructive-foreground mt-4">
              Note: This section is age-gated for users under 25.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Available Collaborations</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-secondary-neon" />
                <p className="ml-3 text-muted-foreground">Loading collaborations...</p>
              </div>
            ) : error ? (
              <p className="text-center text-destructive py-4">Error loading collaborations: {error}</p>
            ) : posts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {posts.map((post) => (
                  <Card key={post.$id} className="p-3 border border-border rounded-md bg-background">
                    <h3 className="font-semibold text-foreground">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{post.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Skills Needed: <span className="font-medium text-foreground">{post.skillsNeeded.join(', ')}</span></p>
                    <p className="text-xs text-muted-foreground">Contact: <span className="font-medium text-foreground">{post.contact}</span></p>
                    <p className="text-xs text-muted-foreground">Posted by: {post.posterName}</p>
                    <div className="flex justify-between items-center mt-2">
                      <Badge className={cn("px-2 py-1 text-xs font-semibold", getStatusBadgeClass(post.status))}>
                        {post.status}
                      </Badge>
                      {user?.$id === post.posterId && post.status === "open" && (
                        <Button variant="secondary" size="sm" onClick={() => updatePostStatus(post.$id, "filled")} className="bg-blue-600 hover:bg-blue-700 text-white">
                          Mark Filled
                        </Button>
                      )}
                      {user?.$id !== post.posterId && post.status === "open" && (
                        <Button variant="secondary" size="sm" onClick={() => toast.info(`Contacting ${post.posterName} at ${post.contact} for collaboration.`)} className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                          Collaborate
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No collaboration opportunities posted yet for your college. Be the first!</p>
            )}
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default CollaboratorsPage;