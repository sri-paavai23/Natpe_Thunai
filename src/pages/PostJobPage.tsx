"use client";

import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, DollarSign, Loader2 } from "lucide-react"; // NEW: Import Loader2
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext"; // NEW: Import useAuth
import { databases, APPWRITE_DATABASE_ID, APPWRITE_SERVICES_COLLECTION_ID,APPWRITE_SERVICE_REVIEWS_COLLECTION_ID } from "@/lib/appwrite"; // NEW: Import Appwrite services
import { ID } from 'appwrite'; // NEW: Import ID

const PostJobPage = () => {
  const { user, userProfile } = useAuth(); // NEW: Use useAuth hook
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobCategory, setJobCategory] = useState("");
  const [compensation, setCompensation] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isPosting, setIsPosting] = useState(false); // NEW: Add loading state

  const handleSubmit = async (e: React.FormEvent) => { // NEW: Make handleSubmit async
    e.preventDefault();
    if (!user || !userProfile) {
      toast.error("You must be logged in to post a job.");
      return;
    }
    if (!userProfile.collegeName) {
      toast.error("Your profile is missing college information. Please update your profile first.");
      return;
    }
    if (!jobTitle || !jobDescription || !jobCategory || !compensation || !contactEmail) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsPosting(true); // NEW: Set loading state
    try {
      const newJobData = {
        title: jobTitle,
        description: jobDescription,
        category: jobCategory,
        price: compensation, // Using 'price' attribute for compensation
        contact: contactEmail,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName, // NEW: Add collegeName
        isCustomOrder: false, // Jobs are not custom orders
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_SERVICES_COLLECTION_ID,
        ID.unique(),
        newJobData
      );

      toast.success(`Job "${jobTitle}" posted successfully!`);
      // In a real app, send data to backend
      setJobTitle("");
      setJobDescription("");
      setJobCategory("");
      setCompensation("");
      setContactEmail("");
    } catch (error: any) {
      console.error("Error posting job:", error);
      toast.error(error.message || "Failed to post job/service.");
    } finally {
      setIsPosting(false); // NEW: Reset loading state
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-20">
      <h1 className="text-4xl font-bold mb-6 text-center text-foreground">Post a Job/Service</h1>
      <div className="max-w-md mx-auto space-y-6">
        <Card className="bg-card text-card-foreground shadow-lg border-border">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xl font-semibold text-card-foreground flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-secondary-neon" /> New Listing
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              Describe the job or service you need help with, or the service you are offering.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="jobTitle" className="text-foreground">Job/Service Title</Label>
                <Input
                  id="jobTitle"
                  type="text"
                  placeholder="e.g., Need a tutor for Calculus"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                  className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                  disabled={isPosting}
                />
              </div>
              <div>
                <Label htmlFor="jobDescription" className="text-foreground">Description</Label>
                <Textarea
                  id="jobDescription"
                  placeholder="Provide details about the task or service..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  required
                  className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                  disabled={isPosting}
                />
              </div>
              <div>
                <Label htmlFor="jobCategory" className="text-foreground">Category</Label>
                <Select value={jobCategory} onValueChange={setJobCategory} required disabled={isPosting}>
                  <SelectTrigger className="w-full bg-input text-foreground border-border focus:ring-ring focus:border-ring">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground border-border">
                    <SelectItem value="tutoring">Tutoring</SelectItem>
                    <SelectItem value="tech-support">Tech Support</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="writing">Writing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="compensation" className="text-foreground">Compensation/Fee</Label>
                <Input
                  id="compensation"
                  type="text"
                  placeholder="e.g., ₹500/hour, Negotiable"
                  value={compensation}
                  onChange={(e) => setCompensation(e.target.value)}
                  required
                  className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                  disabled={isPosting}
                />
              </div>
              <div>
                <Label htmlFor="contactEmail" className="text-foreground">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="your.email@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                  className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
                  disabled={isPosting}
                />
              </div>
              <Button type="submit" className="w-full bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90" disabled={isPosting}>
                {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><DollarSign className="mr-2 h-4 w-4" /> Post Job/Service</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default PostJobPage;