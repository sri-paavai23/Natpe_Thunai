import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollaboratorPosts, ProjectCategory } from '@/hooks/useCollaboratorPosts';
import { toast } from 'sonner';

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  category: z.enum(["Academic", "Startup", "Event", "Research", "Other"]),
  skillsNeeded: z.string().min(1, { message: "At least one skill is required (comma-separated)." }),
  contactInfo: z.string().min(1, { message: "Contact information is required." }),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
});

interface PostProjectFormProps {
  onSuccess: () => void;
}

const PostProjectForm: React.FC<PostProjectFormProps> = ({ onSuccess }) => {
  const { postProject } = useCollaboratorPosts();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "Academic",
      skillsNeeded: "",
      contactInfo: "",
      imageUrl: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await postProject({
        title: data.title,
        description: data.description,
        category: data.category,
        skillsNeeded: data.skillsNeeded.split(',').map(s => s.trim()).filter(s => s.length > 0),
        contactInfo: data.contactInfo,
        imageUrl: data.imageUrl || undefined,
      });
      onSuccess();
      form.reset();
    } catch (error) {
      console.error("Error posting project:", error);
      toast.error("Failed to post project.");
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
              <FormLabel>Project Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., AI-powered Study Buddy" {...field} />
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
                <Textarea placeholder="Detailed description of your project..." rows={3} {...field} />
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
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Startup">Startup</SelectItem>
                  <SelectItem value="Event">Event</SelectItem>
                  <SelectItem value="Research">Research</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="skillsNeeded"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skills Needed (comma-separated)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., React, Node.js, UI/UX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/project.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Posting Project..." : "Post Project"}
        </Button>
      </form>
    </Form>
  );
};

export default PostProjectForm;