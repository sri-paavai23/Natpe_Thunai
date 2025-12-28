import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { useServiceListings, ServiceCategory } from '@/hooks/useServiceListings';
import ServiceCard from '@/components/ServiceCard';
import PostServiceForm from '@/components/forms/PostServiceForm';
import { toast } from 'sonner';
import { Briefcase, Lightbulb, Code, Paintbrush, Wrench, Heart, MoreHorizontal } from 'lucide-react';

const categoryIcons = {
  Academics: Lightbulb,
  Tech: Code,
  Creative: Paintbrush,
  "Manual Labor": Wrench,
  Wellness: Heart,
  Other: MoreHorizontal,
};

const FreelancePage = () => {
  const { user, userProfile } = useAuth();
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | "All">("All");
  const [isPostServiceDialogOpen, setIsPostServiceDialogOpen] = useState(false);

  const { services, isLoading, error, refetch } = useServiceListings(
    activeCategory === "All" ? undefined : activeCategory
  );

  const handlePostServiceSuccess = () => {
    setIsPostServiceDialogOpen(false);
    refetch();
    toast.success("Service posted successfully!");
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading services...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-foreground">Freelance Services</h1>

      <div className="flex justify-end mb-4">
        <Dialog open={isPostServiceDialogOpen} onOpenChange={setIsPostServiceDialogOpen}>
          <DialogTrigger asChild>
            <Button>Post New Service</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Post a New Service</DialogTitle>
              <DialogDescription>
                Offer your skills to other students in your college.
              </DialogDescription>
            </DialogHeader>
            <PostServiceForm onSuccess={handlePostServiceSuccess} /> {/* Corrected prop */}
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as ServiceCategory | "All")} className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-7">
          <TabsTrigger value="All">
            <Briefcase className="h-4 w-4 mr-2" /> All
          </TabsTrigger>
          {Object.entries(categoryIcons).map(([category, Icon]) => (
            <TabsTrigger key={category} value={category}>
              <Icon className="h-4 w-4 mr-2" /> {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            {activeCategory === "All" ? "All Services" : `${activeCategory} Services`}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.length > 0 ? (
              services.map(service => (
                <ServiceCard key={service.$id} service={service} />
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground">No services found in this category.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FreelancePage;