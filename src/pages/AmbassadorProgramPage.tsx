"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, HeartHandshake, Mail, ArrowLeft, DollarSign, FileText } from "lucide-react"; // Added DollarSign, FileText
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import JoinAmbassadorForm from "@/components/forms/JoinAmbassadorForm";
import { useNavigate, Link } from "react-router-dom"; // Added Link

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

        {/* NEW: Ambassador Program Details Card */}
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-secondary-neon" /> What it Means to be an Ambassador
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <p className="text-sm text-muted-foreground">
              Becoming a Natpe🤝Thunai Ambassador means being a pillar of trust and efficiency in your campus community.
            </p>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-primary" /> Your Role
              </h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-4">
                <li>**Facilitate Deliveries:** Mediate exchanges for users who opt for ambassador delivery, ensuring smooth and safe transactions.</li>
                <li>**Maintain Payment Flow:** Assist in verifying payments and ensuring funds reach the correct parties.</li>
                <li>**Run Campaigns:** Organize and promote Natpe🤝Thunai events and services within your college.</li>
                <li>**Community Building:** Act as a trusted point of contact, fostering a positive and helpful environment.</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" /> Earning & Payment
              </h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-4">
                <li>**Transaction-Based Earnings:** Ambassadors are compensated based on the number and value of transactions they successfully facilitate. This is not a fixed monthly salary.</li>
                <li>**Monthly Reporting:** To ensure accurate payment, ambassadors are required to maintain a simple "excel report" (or similar digital log) of their monthly activities and facilitated transactions. This report will be reviewed for payment processing.</li>
                <li>**Contribution, Not Employment:** This program is designed for community contribution and flexible earning, not as a traditional employment role.</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Important Policy
              </h3>
              <p className="text-sm text-muted-foreground">
                Please review our <Link to="/profile/policies" className="text-secondary-neon hover:underline">Ambassador Misuse Policy</Link> to understand the guidelines for fair use of ambassador services and the special considerations for female users.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default AmbassadorProgramPage;