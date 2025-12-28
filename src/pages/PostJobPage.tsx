import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const PostJobPage = () => {
  const { user, userProfile } = useAuth(); // NEW: Use useAuth hook
  const navigate = useNavigate();

  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState(""); // Full-time, Part-time, Internship
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [applicationLink, setApplicationLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile?.collegeName) {
      toast.error("You must be logged in and have a college name set to post a job.");
      navigate('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call to post job
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log("Job Posted:", {
        jobTitle,
        companyName,
        location,
        jobType,
        description,
        requirements,
        applicationLink,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName,
      });

      toast.success("Job posted successfully!");
      // Clear form
      setJobTitle("");
      setCompanyName("");
      setLocation("");
      setJobType("");
      setDescription("");
      setRequirements("");
      setApplicationLink("");
    } catch (error) {
      console.error("Failed to post job:", error);
      toast.error("Failed to post job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground">Post a New Job</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Software Engineer Intern"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Tech Innovations Inc."
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Bengaluru, India (Remote)"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobType">Job Type</Label>
                <Select value={jobType} onValueChange={setJobType} required>
                  <SelectTrigger id="jobType">
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a detailed description of the job role and responsibilities."
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="List the required skills, qualifications, and experience."
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicationLink">Application Link</Label>
              <Input
                id="applicationLink"
                type="url"
                value={applicationLink}
                onChange={(e) => setApplicationLink(e.target.value)}
                placeholder="e.g., https://company.com/careers/job-title"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Posting Job..." : "Post Job"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PostJobPage;