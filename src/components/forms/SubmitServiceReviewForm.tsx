"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { useServiceReviews } from "@/hooks/useServiceReviews";

const formSchema = z.object({
  rating: z.number().min(1, { message: "Please provide a rating." }).max(5, { message: "Rating must be between 1 and 5." }),
  comment: z.string().optional(),
});

interface SubmitServiceReviewFormProps {
  serviceId: string;
  providerId: string;
  onReviewSubmitted: () => void;
  onCancel: () => void;
}

const SubmitServiceReviewForm: React.FC<SubmitServiceReviewFormProps> = ({
  serviceId,
  providerId,
  onReviewSubmitted,
  onCancel,
}) => {
  const { addReview } = useServiceReviews(serviceId);
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  React.useEffect(() => {
    form.setValue("rating", rating);
  }, [rating, form]);

  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await addReview({
        serviceId,
        providerId,
        rating: data.rating,
        comment: data.comment,
      });
      onReviewSubmitted();
      form.reset();
      setRating(0);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormItem>
          <FormLabel className="text-foreground">Your Rating</FormLabel>
          <FormControl>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 cursor-pointer ${
                    star <= rating ? "text-yellow-500 fill-current" : "text-muted-foreground"
                  }`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Comment (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Share your experience..." {...field} disabled={isSubmitting} className="bg-input text-foreground border-border focus:ring-ring focus:border-ring" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Review"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default SubmitServiceReviewForm;