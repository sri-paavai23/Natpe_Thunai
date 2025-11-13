"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

interface PostServiceFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    category: string;
    price: string;
    contact: string;
    customOrderDescription?: string; // New optional field
  }) => void;
  onCancel: () => void;
  initialCategory?: string; // Optional prop to pre-select category
  isCustomOrder?: boolean; // New prop to indicate if it's a custom order form
}

const PostServiceForm: React.FC<PostServiceFormProps> = ({ onSubmit, onCancel, initialCategory = "", isCustomOrder = false }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [price, setPrice] = useState("");
  const [contact, setContact] = useState("");
  const [customOrderDescription, setCustomOrderDescription] = useState(""); // New state

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !category || !price || !contact) {
      toast.error("Please fill in all required fields.");
      return;
    }
    onSubmit({ title, description, category, price, contact, customOrderDescription });
    setTitle("");
    setDescription("");
    setCategory(initialCategory);
    setPrice("");
    setContact("");
    setCustomOrderDescription("");
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="title" className="text-left sm:text-right text-foreground">{isCustomOrder ? "Custom Order Title" : "Service Title"}</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder={isCustomOrder ? "e.g., Vegan Meal Prep for a Week" : "e.g., Professional Resume Writing"}
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="description" className="text-left sm:text-right text-foreground">{isCustomOrder ? "Brief Description" : "Description"}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder={isCustomOrder ? "Briefly describe your custom request." : "Detail your service, experience, and what clients can expect."}
          required
        />
      </div>
      {isCustomOrder && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
          <Label htmlFor="customOrderDescription" className="text-left sm:text-right text-foreground">Detailed Customization (Optional)</Label>
          <Textarea
            id="customOrderDescription"
            value={customOrderDescription}
            onChange={(e) => setCustomOrderDescription(e.target.value)}
            className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
            placeholder="e.g., Specific ingredients, dietary restrictions, preparation methods, or remedy components."
          />
          <p className="text-xs text-muted-foreground mt-1 col-span-4 sm:col-start-2">
            Provide detailed instructions for your custom food or wellness remedy.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="category" className="text-left sm:text-right text-foreground">Category</Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger className="col-span-3 w-full bg-input text-foreground border-border focus:ring-ring focus:border-ring">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            <SelectItem value="resume-building">Resume Building</SelectItem>
            <SelectItem value="video-editing">Video Editing</SelectItem>
            <SelectItem value="content-writing">Content Writing</SelectItem>
            <SelectItem value="graphic-design">Graphic Design</SelectItem>
            <SelectItem value="homemade-meals">Homemade Meals</SelectItem>
            <SelectItem value="wellness-remedies">Wellness Remedies</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 sm:gap-4 items-center">
        <Label htmlFor="price" className="text-left sm:text-right text-foreground">{isCustomOrder ? "Proposed Budget" : "Price/Fee"}</Label>
        <Input
          id="price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="col-span-3 bg-input text-foreground border-border focus:ring-ring focus:border-ring"
          placeholder={isCustomOrder ? "e.g., ₹1000-₹1500, Negotiable" : "e.g., ₹500/hour, Negotiable"}
          required
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
          {isCustomOrder ? "Post Custom Request" : "Post Service"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default PostServiceForm;