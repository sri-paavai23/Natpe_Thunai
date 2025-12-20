"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Star, Loader2 } from "lucide-react";
import { useServiceReviews } from "@/hooks/useServiceReviews";
import { cn } from "@/lib/utils";

interface ReviewServiceDialogProps {
  serviceId: string;
  sellerId: string; // NEW: Accept sellerId
  serviceTitle: string;
  onReviewSubmitted: () => void;
  onCancel: () => void;
}

const ReviewServiceDialog: React.FC<ReviewServiceDialogProps> = ({
  serviceId,
  sellerId, // NEW: Destructure sellerId
  serviceTitle,
  onReviewSubmitted,
  onCancel,
}) => {
  const { submitReview } = useServiceReviews(); // Use the hook to get submitReview
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }
    if (comment.trim().length < 10) {
      toast.error("Please provide a comment of at least 10 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReview(serviceId, sellerId, { rating, comment }); // Pass sellerId
      onReviewSubmitted();
    } catch (error) {
      // Error handled by useServiceReviews hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="rating" className="text-foreground">Your Rating for "{serviceTitle}"</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                "h-6 w-6 cursor-pointer transition-colors",
                rating >= star ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
              )}
              onClick={() => setRating(star)}
            />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="comment" className="text-foreground">Your Comment</Label>
        <Textarea
          id="comment"
          placeholder="Share your experience with this service..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="bg-input text-input-foreground border-border focus-visible:ring-secondary-neon"
        />
      </div>
      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button onClick={handleSubmitReview} disabled={isSubmitting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Review"}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default ReviewServiceDialog;