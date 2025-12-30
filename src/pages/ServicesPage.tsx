"use client";

import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { HeartHandshake } from "lucide-react";
import StudentWelfareLinks from "@/components/StudentWelfareLinks";

const ServicesPage = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const userAge = userProfile?.age || 0; 
  const isAgeGated = userAge >= 25; 

  const handleServiceClick = (path: string, serviceName: string) => {
    if (isAgeGated && (path === "/services/errands" || path === "/services/short-term")) {
      toast.error(`Access denied: "${serviceName}" is not available for users aged 25 and above.`);
      return;
    }
    toast.info(`Navigating to "${serviceName}"...`);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">The Grind (Services)</h1>
      <div className="max-w-md mx-auto space-y-6">
        {/* Student Welfare & E-commerce Links */}
        <StudentWelfareLinks />

        <Card className="bg-card p-4 rounded-lg shadow-md border border-border cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleServiceClick("/services/freelance", "Freelance Section")}>
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Freelance Section</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground">Resume Building, Video Editing, Content Writing, and more.</p>
          </CardContent>
        </Card>

        {/* Errands Card (Age Gated) */}
        <Card 
          className={`bg-card p-4 rounded-lg shadow-md border border-border transition-shadow ${isAgeGated ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl'}`} 
          onClick={() => handleServiceClick("/services/errands", "Errands")}
        >
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Errands</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground">Note-writing, small jobs, delivery services {isAgeGated ? "(Access Denied)" : "(Age-Gated)"}.</p>
          </CardContent>
        </Card>

        {/* Post a Need Card (Age Gated) */}
        <Card 
          className={`bg-card p-4 rounded-lg shadow-md border border-border transition-shadow ${isAgeGated ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl'}`} 
          onClick={() => handleServiceClick("/services/short-term", "Post a Need")}
        >
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Post a Need</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground">Post requests for products, services, errands, and more {isAgeGated ? "(Access Denied)" : "(Age-Gated)"}.</p>
          </CardContent>
        </Card>

        <Card className="bg-card p-4 rounded-lg shadow-md border border-border cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleServiceClick("/services/food-wellness", "Food & Wellness")}>
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Food & Wellness</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground">Homemade food/remedies with cancellation warning and quality assurance.</p>
          </CardContent>
        </Card>

        {/* The Edit Card (formerly Ticket Booking) */}
        <Card className="bg-card p-4 rounded-lg shadow-md border border-border cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleServiceClick("/services/the-edit", "The Edit")}>
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">The Edit</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground">Curated deals and essential products for students, powered by Cuelinks.</p>
          </CardContent>
        </Card>

        <Card className="bg-card p-4 rounded-lg shadow-md border border-border cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleServiceClick("/services/collaborators", "Project Collaborator Tab")}>
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground">Project Collaborator Tab</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground">Post or search for collaborators for academic or personal projects.</p>
          </CardContent>
        </Card>
        
        {/* New Ambassador Program Card */}
        <Card className="bg-card p-4 rounded-lg shadow-md border border-border cursor-pointer hover:shadow-xl transition-shadow" onClick={() => handleServiceClick("/services/ambassador-program", "Ambassador Program")}>
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-secondary-neon" /> Ambassador Program
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-muted-foreground">Join our team to facilitate deliveries and ensure trust in transactions.</p>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default ServicesPage;