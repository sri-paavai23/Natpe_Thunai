"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, HeartHandshake, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import JoinAmbassadorForm from "@/components/forms/JoinAmbassadorForm";
import { useNavigate } from "react-router-dom";

const AmbassadorProgramPage = () => {
  const navigate = useNavigate();
  const [isAmbassadorFormOpen, setIsAmbassadorFormOpen] = useState(false);

  const handleAmbassadorApply = (data: { name: string; email: string; mobile: string; whyJoin: string }) => {
    console.log("Ambassador Application:", data);
    toast.success("Ambassador application submitted! We'll review it shortly.");
    setIsAmbassadorFormOpen(false);
    // In a real app, this data would be sent to a backend for processing.
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-secondary-neon">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Services
        </Button>
        
        <h1 className="text-4xl font-bold text-center text-foreground">Ambassador Program</h1>

        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-secondary-neon" /> Join Our Team
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              Our ambassadors are crucial for facilitating deliveries, ensuring smooth transactions, and building trust within the campus community.
            </p>
            <p className="text-sm text-muted-foreground font-semibold">
              Ambassador Coordinator:
            </p>
            <div className="flex items-center gap-2 text-sm text-foreground">
                <Mail className="h-4 w-4 text-secondary-neon" />
                <span>ambassador.lead@example.com</span>
            </div>
            
            <Dialog open={isAmbassadorFormOpen} onOpenChange={setIsAmbassadorFormOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
                  <HeartHandshake className="mr-2 h-4 w-4" /> Apply Now
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Ambassador Application</DialogTitle>
                </DialogHeader>
                <JoinAmbassadorForm onApply={handleAmbassadorApply} onCancel={() => setIsAmbassadorFormOpen(false)} />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default AmbassadorProgramPage;