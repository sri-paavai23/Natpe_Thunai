"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Star } from "lucide-react";
import { useServiceReviews } from "@/hooks/useServiceReviews"; // Import the hook
import { useAuth } from "@/context/AuthContext"; // NEW: Import useAuth

interface SubmitServiceReviewFormProps {
  serviceId: string;
  serviceTitle: string;
  onReviewSubmitted: () => void;
  onCancel: () => void;
}

const SubmitServiceReviewForm: React.FC<SubmitServiceReviewFormProps> = ({
  serviceId,
  serviceTitle,
  onReviewSubmitted,
  onCancel,
}) => {
  const { user, userProfile } = useAuth(); // NEW: Use useAuth hook
  const { submitReview } = useServiceReviews(serviceId); // Use the hook to submit
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (starValue: number) => {
    setRating(starValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Added explicit check for user.$id
    if (!user || !user.$id || !userProfile || !userProfile.collegeName) {
      toast.error("You must be logged in with a complete profile to submit a review.");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please provide a comment for your review.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReview({ // NEW: The submitReview function now correctly expects only rating and comment
        rating: rating,
        comment: comment.trim(),
      });
      onReviewSubmitted();
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label className="text-foreground">Your Rating for "{serviceTitle}"</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((starValue) => (
            <Star
              key={starValue}
              className={`h-6 w-6 cursor-pointer ${
                starValue <= rating ? "fill-secondary-neon text-secondary-neon" : "text-muted-foreground"
              }`}
              onClick={() => handleStarClick(starValue)}
            />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="comment" className="text-foreground">Your Comment</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this service..."
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          required
          disabled={isSubmitting}
        />
      </div>
      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Review"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default SubmitServiceReviewForm;