"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { databases, APPWRITE_DATABASE_ID, APPWRITE_REPORTS_COLLECTION_ID } from "@/lib/appwrite";
import { ID } from 'appwrite';
import { Loader2 } from "lucide-react";
import { containsBlockedWords } from "@/lib/moderation";

interface ReportListingFormProps {
  productId: string;
  productTitle: string;
  sellerId: string;
  onReportSubmitted: () => void;
  onCancel: () => void;
}

const ReportListingForm: React.FC<ReportListingFormProps> = ({
  productId,
  productTitle,
  sellerId,
  onReportSubmitted,
  onCancel,
}) => {
  const { user, userProfile } = useAuth();
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) {
      toast.error("You must be logged in to submit a report.");
      return;
    }
    if (!userProfile.collegeName) {
      toast.error("Your profile is missing college information. Please update your profile first.");
      return;
    }
    if (!reason) {
      toast.error("Please select a reason for the report.");
      return;
    }
    if (containsBlockedWords(message)) {
      toast.error("Your message contains inappropriate language. Please revise.");
      return;
    }

    setIsSubmitting(true);
    try {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_REPORTS_COLLECTION_ID,
        ID.unique(),
        {
          reporterId: user.$id,
          reporterName: user.name,
          productId: productId,
          productTitle: productTitle,
          sellerId: sellerId,
          reason: reason,
          message: message.trim() || null,
          status: "Pending", // Initial status
          collegeName: userProfile.collegeName,
        }
      );
      toast.success("Report submitted successfully! Developers will review it shortly.");
      onReportSubmitted();
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast.error(error.message || "Failed to submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="reason" className="text-foreground">Reason for Report</Label>
        <Select value={reason} onValueChange={setReason} required disabled={isSubmitting}>
          <SelectTrigger className="w-full bg-input text-foreground border-border focus:ring-ring focus:border-ring">
            <SelectValue placeholder="Select a reason" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            <SelectItem value="inappropriate-content">Inappropriate Content</SelectItem>
            <SelectItem value="scam-fraud">Scam/Fraud Attempt</SelectItem>
            <SelectItem value="misleading-information">Misleading Information</SelectItem>
            <SelectItem value="prohibited-item">Prohibited Item</SelectItem>
            <SelectItem value="harassment">Harassment</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="message" className="text-foreground">Additional Details (Optional)</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Provide more details about the issue..."
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          disabled={isSubmitting}
        />
      </div>
      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Report"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default ReportListingForm;