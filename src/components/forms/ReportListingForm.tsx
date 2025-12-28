import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ReportListingFormProps {
  listingId: string;
  listingType: 'product' | 'service' | 'errand' | 'canteen' | 'tournament' | 'collaboratorPost' | 'lostFoundItem';
  onReportSubmitted: () => void;
  onCancel: () => void;
}

const ReportListingForm: React.FC<ReportListingFormProps> = ({
  listingId,
  listingType,
  onReportSubmitted,
  onCancel,
}) => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReport = async () => {
    if (!user || !userProfile) {
      toast.error("You must be logged in to report a listing.");
      navigate('/login');
      return;
    }
    if (!reason) {
      toast.error("Please select a reason for the report.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call to submit report
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log("Report Submitted:", {
        reporterId: user.$id,
        reporterName: user.name,
        collegeName: userProfile.collegeName,
        listingId,
        listingType,
        reason,
        description,
        status: "Pending", // Default status
      });

      toast.success("Report submitted successfully! We will review it shortly.");
      onReportSubmitted();
    } catch (error) {
      console.error("Failed to submit report:", error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Listing</DialogTitle>
          <DialogDescription>
            Help us keep the platform safe by reporting inappropriate content.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Report</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spam">Spam</SelectItem>
                <SelectItem value="inappropriate-content">Inappropriate Content</SelectItem>
                <SelectItem value="misleading-information">Misleading Information</SelectItem>
                <SelectItem value="scam">Scam/Fraud</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more details about why you are reporting this listing."
              rows={4}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmitReport} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportListingForm;