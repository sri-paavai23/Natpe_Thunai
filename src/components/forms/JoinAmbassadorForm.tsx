"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext"; // NEW: Import useAuth
import { databases, APPWRITE_DATABASE_ID } from "@/lib/appwrite"; // NEW: Import Appwrite services
import { ID } from 'appwrite'; // NEW: Import ID
import { Loader2 } from "lucide-react"; // NEW: Import Loader2

// Define a new collection ID for ambassador applications
export const APPWRITE_AMBASSADOR_APPLICATIONS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_AMBASSADOR_APPLICATIONS_COLLECTION_ID || 'ambassador_applications';

interface JoinAmbassadorFormProps {
  onApply: (data: {
    name: string;
    email: string;
    mobile: string;
    whyJoin: string;
  }) => void;
  onCancel: () => void;
}

const JoinAmbassadorForm: React.FC<JoinAmbassadorFormProps> = ({ onApply, onCancel }) => {
  const { user, userProfile } = useAuth(); // NEW: Use useAuth hook
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [whyJoin, setWhyJoin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // NEW: Add loading state

  const handleSubmit = async (e: React.FormEvent) => { // NEW: Make handleSubmit async
    e.preventDefault();
    // Added explicit check for user.$id
    if (!user || !user.$id || !userProfile) {
      toast.error("You must be logged in with a complete profile to apply.");
      return;
    }
    if (!userProfile.collegeName) {
      toast.error("Your profile is missing college information. Please update your profile first.");
      return;
    }
    if (!name || !email || !mobile || !whyJoin) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true); // NEW: Set loading state
    try {
      const applicationData = {
        applicantId: user.$id,
        applicantName: name,
        applicantEmail: email,
        applicantMobile: mobile,
        whyJoin: whyJoin,
        collegeName: userProfile.collegeName, // NEW: Add collegeName
        status: "Pending", // Initial status
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_AMBASSADOR_APPLICATIONS_COLLECTION_ID,
        ID.unique(),
        applicationData
      );

      toast.success("Ambassador application submitted! We'll review it shortly.");
      onApply({ name, email, mobile, whyJoin }); // Call original onApply prop
      setName("");
      setEmail("");
      setMobile("");
      setWhyJoin("");
    } catch (error: any) {
      console.error("Error submitting ambassador application:", error);
      toast.error(error.message || "Failed to submit application. Check Appwrite collection permissions.");
    } finally {
      setIsSubmitting(false); // NEW: Reset loading state
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="name" className="text-left sm:text-right text-foreground">
          Your Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="John Doe"
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="email" className="text-left sm:text-right text-foreground">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="your.email@example.com"
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="mobile" className="text-left sm:text-right text-foreground">
          Mobile Number
        </Label>
        <Input
          id="mobile"
          type="tel"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="9876543210"
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="whyJoin" className="text-left sm:text-right text-foreground">
          Why join us?
        </Label>
        <Textarea
          id="whyJoin"
          value={whyJoin}
          onChange={(e) => setWhyJoin(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="Tell us why you'd be a great ambassador..."
          required
          disabled={isSubmitting}
        />
      </div>
      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Application"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default JoinAmbassadorForm;