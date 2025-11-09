"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

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
}

const PostErrandForm: React.FC<PostErrandFormProps> = ({ onSubmit, onCancel, initialType = "" }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState(initialType);
  const [compensation, setCompensation] = useState("");
  const [deadline, setDeadline] = useState("");
  const [contact, setContact] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !type || !compensation || !contact) {
      toast.error("Please fill in all required fields.");
      return;
    }
    onSubmit({ title, description, type, compensation, deadline, contact });
    setTitle("");
    setDescription("");
    setType(initialType);
    setCompensation("");
    setDeadline("");
    setContact("");
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
          placeholder="Provide details about the errand, location, and any specific instructions."
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="type" className="text-left sm:text-right text-foreground">
          Errand Type
        </Label>
        <Select value={type} onValueChange={setType} required>
          <SelectTrigger className="col-span-3 w-full bg-input text-foreground border-border focus:ring-ring focus:border-ring">
            <SelectValue placeholder="Select errand type" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            <SelectItem value="note-writing">Note-writing/Transcription</SelectItem>
            <SelectItem value="small-job">Small Job (e.g., moving books)</SelectItem>
            <SelectItem value="delivery">Delivery Services (within campus)</SelectItem>
            <SelectItem value="instant-help">Instant Help</SelectItem>
            <SelectItem value="emergency-delivery">Emergency Deliveries</SelectItem>
            <SelectItem value="other">Other</SelectItem>
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
        />
      </div>
      <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          Post Errand
        </Button>
      </DialogFooter>
    </form>
  );
};

export default PostErrandForm;