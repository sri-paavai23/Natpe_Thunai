"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, Loader2, Mail, Calendar, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CollaboratorForm from "@/components/forms/CollaboratorForm";
import { useCollaboratorPosts, CollaboratorPost } from "@/hooks/useCollaboratorPosts";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_COLLABORATORS_COLLECTION_ID } from "@/lib/appwrite"; // Fixed: Corrected import
import { ID } from 'appwrite';
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const CollaboratorsPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { collaboratorPosts, isLoading: postsLoading, error } = useCollaboratorPosts();
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);

  const handleFormSuccess = () => {
    setIsFormDialogOpen(false);
    toast.success("Collaboration post created successfully!");
  };

  const handleFormCancel = () => {
    setIsFormDialogOpen(false);
  };

  const handleMarkAsFilled = async (post: CollaboratorPost) => {
    if (!user || post.posterId !== user.$id) {
      toast.error("You can only mark your own posts as filled.");
      return;
    }
    if (post.status !== "Open") {
      toast.error("This post is not open.");
      return;
    }

    try {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_COLLABORATORS_COLLECTION_ID,
        post.$id,
        { status: "Filled" }
      );
      toast.success(`Collaboration post "${post.title}" marked as filled!`);
    } catch (error: any) {
      console.error("Error marking post as filled:", error);
      toast.error(error.message || "Failed to mark post as filled.");
    }
  };

  const renderContent = () => {
    if (authLoading || postsLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-secondary-neon" />
          <p className="ml-3 text-muted-foreground">Loading collaboration posts...</p>
        </div>
      );
    }

    if (error) {
      return <p className="text-center text-destructive py-4">Error: {error}</p>;
    }

    if (collaboratorPosts.length === 0) {
      return <p className="text-center text-muted-foreground py-4">No collaboration posts yet. Be the first to post one!</p>;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {collaboratorPosts.map((post) => (
          <Card key={post.$id} className="bg-card border-border p-4 shadow-md">
            <CardHeader className="p-0 pb-2">
              <CardTitle className="text-lg font-semibold text-foreground">{post.title}</CardTitle>
              <Badge className={cn(
                "mt-1",
                post.status === "Open" && "bg-green-500",
                post.status === "Filled" && "bg-orange-500",
                post.status === "Completed" && "bg-blue-500"
              )}>{post.status}</Badge>
            </CardHeader>
            <CardContent className="p-0 space-y-2 text-sm text-muted-foreground">
              <p>{post.description}</p>
              <p className="flex items-center gap-2"><Lightbulb className="h-4 w-4 text-secondary-neon" /> Project Type: {post.projectType}</p>
              <p className="flex items-center gap-2"><Users className="h-4 w-4 text-secondary-neon" /> Skills: {post.skillsRequired.join(', ')}</p>
              <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-secondary-neon" /> Contact: {post.contactEmail}</p>
              {post.deadline && <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-secondary-neon" /> Deadline: {new Date(post.deadline).toLocaleDateString()}</p>}
              <p className="text-xs">Posted by: {post.posterName}</p>
              {post.status === "Open" && user?.$id === post.posterId && (
                <Button
                  className="w-full mt-4 bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90"
                  onClick={() => handleMarkAsFilled(post)}
                >
                  Mark as Filled
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Collaborators</h1>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary-neon" /> Find or Post Collaborations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Find teammates for projects, events, or startup ideas. Post your own collaboration needs!
            </p>
            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                  <PlusCircle className="mr-2 h-4 w-4" /> Post New Collaboration
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Create New Collaboration Post</DialogTitle>
                </DialogHeader>
                <CollaboratorForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {renderContent()}
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default CollaboratorsPage;