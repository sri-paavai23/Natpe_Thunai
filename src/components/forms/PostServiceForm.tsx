import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useServiceListings, ServiceCategory } from '@/hooks/useServiceListings';
import { toast } from 'sonner';

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  category: z.enum(["Academics", "Tech", "Creative", "Manual Labor", "Wellness", "Other"]),
  price: z.coerce.number().min(0, { message: "Price cannot be negative." }),
  priceUnit: z.string().min(1, { message: "Price unit is required." }),
  contactInfo: z.string().min(1, { message: "Contact information is required." }),
  location: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  isCustomOrder: z.boolean().optional(),
  customOrderDescription: z.string().optional(),
});

interface PostServiceFormProps {
  onSuccess: () => void; // Added onSuccess prop
}

const PostServiceForm: React.FC<PostServiceFormProps> = ({ onSuccess }) => {
  const { postService } = useServiceListings();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "Academics",
      price: 0,
      priceUnit: "hour",
      contactInfo: "",
      location: "",
      imageUrl: "",
      isCustomOrder: false,
      customOrderDescription: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await postService({
        title: data.title,
        description: data.description,
        category: data.category,
        price: data.price,
        priceUnit: data.priceUnit,
        contactInfo: data.contactInfo,
        location: data.location || undefined,
        imageUrl: data.imageUrl || undefined,
        isCustomOrder: data.isCustomOrder || false,
        customOrderDescription: data.customOrderDescription || undefined,
      });
      onSuccess();
      form.reset();
    } catch (error) {
      console.error("Error posting service:", error);
      toast.error("Failed to post service.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Math Tutoring" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Detailed description of your service..." rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Academics">Academics</SelectItem>
                  <SelectItem value="Tech">Tech</SelectItem>
                  <SelectItem value="Creative">Creative</SelectItem>
                  <SelectItem value="Manual Labor">Manual Labor</SelectItem>
                  <SelectItem value="Wellness">Wellness</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (₹)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priceUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price Unit</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="e.g., hour, task" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="hour">hour</SelectItem>
                    <SelectItem value="task">task</SelectItem>
                    <SelectItem value="project">project</SelectItem>
                    <SelectItem value="session">session</SelectItem>
                    <SelectItem value="item">item</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="contactInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Information</FormLabel>
              <FormControl>
                <Input placeholder="Your phone number or email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., College Library" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/service.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center space-x-2">
          <FormField
            control={form.control}
            name="isCustomOrder"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="h-4 w-4 text-primary rounded"
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Is this a custom order request?
                  </FormLabel>
                  <FormDescription>
                    Check this if you are requesting a custom service (e.g., a specific meal).
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>
        {form.watch("isCustomOrder") && (
          <FormField
            control={form.control}
            name="customOrderDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Custom Order Details</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe your custom order in detail..." rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Posting Service..." : "Post Service"}
        </Button>
      </form>
    </Form>
  );
};

export default PostServiceForm;