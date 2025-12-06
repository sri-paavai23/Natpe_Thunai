"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Wrench, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ServiceListingFormWrapper from "@/components/forms/ServiceListingFormWrapper";
import ServiceListingCard from "@/components/ServiceListingCard";
import { useServiceListings, ServicePost } from "@/hooks/useServiceListings";
import { useAuth } from "@/context/AuthContext";

const ServicesPage = () => {
  const { userProfile, isLoading: authLoading } = useAuth();
  const { services, isLoading: servicesLoading, error } = useServiceListings();
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);

  // Get user's age from profile, default to 0 if not available
  const userAge = userProfile?.age || 0; // Fixed: Use existing age or default
  // Content is age-gated if user is 25 or older (meaning they CANNOT access it)
  const isAgeGated = userAge >= 25;

  const handleFormSuccess = () => {
    setIsFormDialogOpen(false);
    toast.success("Service listing created!");
    // The useServiceListings hook should automatically re-fetch due to subscription
  };

  const handleFormCancel = () => {
    setIsFormDialogOpen(false);
  };

  const renderContent = () => {
    if (authLoading || servicesLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-secondary-neon" />
          <p className="ml-3 text-muted-foreground">Loading services...</p>
        </div>
      );
    }

    if (error) {
      return <p className="text-center text-destructive py-4">Error: {error}</p>;
    }

    if (isAgeGated) {
      return (
        <Card className="bg-destructive/10 border-destructive text-destructive-foreground shadow-lg">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-destructive flex items-center gap-2">
              <Wrench className="h-5 w-5 text-destructive" /> Restricted Access
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-gray-800">
              This section is restricted for users aged 25 and above.
            </p>
            <p className="text-xs text-gray-600 mt-2">
              Please contact support if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (services.length === 0) {
      return <p className="text-center text-muted-foreground py-4">No services posted yet. Be the first!</p>;
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {services.map((service) => (
          <ServiceListingCard key={service.$id} service={service} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Campus Services</h1>
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Wrench className="h-5 w-5 text-secondary-neon" /> Offer or Request Services
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            <p className="text-sm text-muted-foreground">
              Find or offer services like tutoring, repairs, event help, and more.
            </p>
            <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" disabled={isAgeGated}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Post New Service
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Create New Service Listing</DialogTitle>
                </DialogHeader>
                <ServiceListingFormWrapper onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
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

export default ServicesPage;