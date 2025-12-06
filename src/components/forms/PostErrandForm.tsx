"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext"; // NEW: Import useAuth
import { databases, APPWRITE_DATABASE_ID, APPWRITE_ERRANDS_COLLECTION_ID } from "@/lib/appwrite"; // NEW: Import Appwrite services
import { ID } from 'appwrite'; // NEW: Import ID
import { Loader2 } from "lucide-react"; // NEW: Import Loader2

interface ErrandCategoryOption {
  value: string;
  label: string;
}

const ALL_ERRAND_CATEGORIES: ErrandCategoryOption[] = [
  { value: "note-writing", label: "Note-writing/Transcription" },
  { value: "small-job", label: "Small Job (e.g., moving books)" },
  { value: "delivery", label: "Delivery Services (within campus)" },
  { value: "instant-help", label: "Instant Help" },
  { value: "emergency-delivery", label: "Emergency Deliveries" },
  { value: "other", label: "Other" },
];

interface PostErrandFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    type: string;
    compensation: string;
    deadline?: string;
    contact: string;
  }) => void;
  onCancel: () => void;
  initialType?: string; // Optional prop to pre-select type
  categoryOptions?: ErrandCategoryOption[]; // New prop for dynamic category filtering
}

const PostErrandForm: React.FC<PostErrandFormProps> = ({ onSubmit, onCancel, initialType = "", categoryOptions }) => {
  const { user, userProfile } = useAuth(); // NEW: Use useAuth hook
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState(initialType);
  const [compensation, setCompensation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [contact, setContact] = useState("");
  const [isPosting, setIsPosting] = useState(false); // NEW: Add loading state

  const categoriesToRender = categoryOptions || ALL_ERRAND_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => { // NEW: Make handleSubmit async
    e.preventDefault();
    // Added explicit check for user.$id
    if (!user || !user.$id || !userProfile || !userProfile.collegeName) {
      toast.error("You must be logged in with a complete profile to post an errand.");
      return;
    }
    if (!title || !description || !type || !compensation || !contact) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsPosting(true); // NEW: Set loading state
    try {
      const newErrandData = {
        title: title,
        description: description,
        type: type,
        compensation: compensation,
        deadline: deadline || null,
        contact: contact,
        posterId: user.$id,
        posterName: user.name,
        collegeName: userProfile.collegeName, // NEW: Add collegeName
      };

      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        APPWRITE_ERRANDS_COLLECTION_ID,
        ID.unique(),
        newErrandData
      );
      
      toast.success(`Your errand "${title}" has been posted!`);
      onSubmit({ title, description, type, compensation, deadline, contact }); // Call original onSubmit prop
      setTitle("");
      setDescription("");
      setType(initialType);
      setCompensation("");
      setDeadline("");
      setContact("");
    } catch (error: any) {
      console.error("Error posting errand:", error);
      toast.error(error.message || "Failed to post errand listing.");
    } finally {
      setIsPosting(false); // NEW: Reset loading state
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="title" className="text-left sm:text-right text-foreground">
          Errand Title
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="e.g., Pick up groceries from store"
          required
          disabled={isPosting}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="description" className="text-left sm:text-right text-foreground">
          Description
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="Provide details about the task or service..."
          required
          disabled={isPosting}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="type" className="text-left sm:text-right text-foreground">
          Errand Type
        </Label>
        <Select value={type} onValueChange={setType} required disabled={isPosting}>
          <SelectTrigger className="col-span-3 w-full bg-input text-foreground border-border focus:ring-ring focus:border-ring">
            <SelectValue placeholder="Select errand type" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            {categoriesToRender.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="compensation" className="text-left sm:text-right text-foreground">
          Compensation
        </Label>
        <Input
          id="compensation"
          value={compensation}
          onChange={(e) => setCompensation(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="e.g., ₹100, Lunch, Negotiable"
          required
          disabled={isPosting}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="deadline" className="text-left sm:text-right text-foreground">
          Deadline (Optional)
        </Label>
        <Input
          id="deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          disabled={isPosting}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="contact" className="text-left sm:text-right text-foreground">
          Contact Email
        </Label>
        <Input
          id="contact"
          type="email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder="your.email@example.com"
          required
          disabled={isPosting}
        />
      </div>
      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPosting} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" disabled={isPosting} className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          {isPosting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Post Errand"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default PostErrandForm;