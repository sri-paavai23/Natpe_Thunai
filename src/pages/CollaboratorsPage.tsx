import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { useCollaboratorPosts, ProjectCategory } from '@/hooks/useCollaboratorPosts';
import CollaboratorPostCard from '@/components/CollaboratorPostCard'; // Assuming CollaboratorPostCard exists
import PostProjectForm from '@/components/forms/PostProjectForm'; // Assuming PostProjectForm exists
import { toast } from 'sonner';
import { Users, GraduationCap, Rocket, Calendar, Lightbulb, MoreHorizontal } from 'lucide-react';

const projectCategoryIcons = {
  Academic: GraduationCap,
  Startup: Rocket,
  Event: Calendar,
  Research: Lightbulb,
  Other: MoreHorizontal,
};

const CollaboratorsPage = () => {
  const { user, userProfile } = useAuth();
  const { posts: allProjectPosts, isLoading, error } = useCollaboratorPosts(); // Fetch all posts
  const [activeCategory, setActiveCategory] = useState<ProjectCategory | "All">("All");
  const [isPostProjectDialogOpen, setIsPostProjectDialogOpen] = useState(false);

  const filteredPosts = activeCategory === "All"
    ? allProjectPosts
    : allProjectPosts.filter(post => post.category === activeCategory);

  const handlePostProjectSuccess = () => {
    setIsPostProjectDialogOpen(false);
    toast.success("Project posted successfully!");
    // refetch is handled by useCollaboratorPosts internally on postProject success
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading projects...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Collaborators</h1>

      <div className="flex justify-end mb-4">
        <Dialog open={isPostProjectDialogOpen} onOpenChange={setIsPostProjectDialogOpen}>
          <DialogTrigger asChild>
            <Button>Post New Project</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Post a New Project</DialogTitle>
              <DialogDescription>
                Find collaborators for your academic, startup, or event projects.
              </DialogDescription>
            </DialogHeader>
            <PostProjectForm onSuccess={handlePostProjectSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as ProjectCategory | "All")} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6">
          <TabsTrigger value="All">
            <Users className="h-4 w-4 mr-2" /> All
          </TabsTrigger>
          {Object.entries(projectCategoryIcons).map(([category, Icon]) => (
            <TabsTrigger key={category} value={category}>
              <Icon className="h-4 w-4 mr-2" /> {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            {activeCategory === "All" ? "All Projects" : `${activeCategory} Projects`}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPosts.length > 0 ? (
              filteredPosts.map(post => (
                <CollaboratorPostCard key={post.$id} post={post} />
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground">No projects found in this category.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CollaboratorsPage;