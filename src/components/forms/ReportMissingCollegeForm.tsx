"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Building2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // Keep useAuth to pre-fill if logged in
import { databases, APPWRITE_DATABASE_ID, APPWRITE_MISSING_COLLEGES_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';

interface ReportMissingCollegeFormProps {
  onReportSubmitted: () => void;
  onCancel: () => void;
}

const ReportMissingCollegeForm: React.FC<ReportMissingCollegeFormProps> = ({
  onReportSubmitted,
  onCancel,
}) => {
  const { user } = useAuth(); // Use user from AuthContext to check login status
  const [collegeName, setCollegeName] = useState("");
  const [location, setLocation] = useState("");
  const [reporterName, setReporterName] = useState(""); // Initialize with empty string
  const [reporterEmail, setReporterEmail] = useState(""); // Initialize with empty string
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update pre-filled fields if user changes after component mounts
  useEffect(() => {
    if (user) {
      setReporterName(user.name);
      setReporterEmail(user.email);
    } else {
      // Clear if user logs out while form is open
      setReporterName("");
      setReporterEmail("");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!collegeName.trim()) {
      toast.error("Please enter the college name.");
      return;
    }

    // If user is not logged in, require name and email
    if (!user && (!reporterName.trim() || !reporterEmail.trim())) {
      toast.error("Please provide your name and email so we can contact you.");
      return;
    }

    setIsSubmitting(true);
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_MISSING_COLLEGES_COLLECTION_ID,
        ID.unique(),
        {
          collegeName: collegeName.trim(),
          location: location.trim() || null,
          requestingUserId: user?.$id || 'guest', // Use user ID if logged in, otherwise 'guest'
          requestingUserName: user?.name || reporterName.trim() || 'Anonymous', // Use user name if logged in, otherwise form input
          requestingUserEmail: user?.email || reporterEmail.trim() || 'anonymous@example.com', // Use user email if logged in, otherwise form input
          status: "Pending",
        }
      );
      toast.success("Missing college reported! We'll review it shortly.");
      onReportSubmitted();

      // Placeholder for gamified reward logic:
      // Once an admin manually verifies this college and updates its status to "Verified"
      // in the Appwrite 'missing_colleges' collection, a separate Appwrite Function
      // or admin action would trigger the following:
      // 1. Add the college to the master list (e.g., update src/lib/largeIndianColleges.ts dynamically).
      // 2. Award XP to the requesting user: `addXp(50);`
      // 3. Potentially assign a "Pioneer" badge to the user's profile.

    } catch (error: any) {
      console.error("Error submitting missing college report:", error);
      toast.error(error.message || "Failed to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="collegeName" className="text-foreground">College Name</Label>
        <Input
          id="collegeName"
          value={collegeName}
          onChange={(e) => setCollegeName(e.target.value)}
          placeholder="e.g., Anna University, Chennai"
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location" className="text-foreground">Location (City/State - Optional)</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., Chennai, Tamil Nadu"
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          disabled={isSubmitting}
        />
      </div>
      {!user && ( // Only show these fields if user is not logged in
        <>
          <div className="space-y-2">
            <Label htmlFor="reporterName" className="text-foreground">Your Name</Label>
            <Input
              id="reporterName"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
              placeholder="Your Name"
              className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reporterEmail" className="text-foreground">Your Email</Label>
            <Input
              id="reporterEmail"
              type="email"
              value={reporterEmail}
              onChange={(e) => setReporterEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
              required
              disabled={isSubmitting}
            />
          </div>
        </>
      )}
      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <><Building2 className="mr-2 h-4 w-4" /> Report College</>}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default ReportMissingCollegeForm;