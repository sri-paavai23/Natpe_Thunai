"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption";

interface GiftCraftRequestFormProps {
  onSubmit: (request: {
    title: string;
    description: string;
    referenceImageUrl: string;
    budget: string;
    contact: string;
    ambassadorDelivery: boolean;
    ambassadorMessage: string;
  }) => void;
  onCancel: () => void;
}

const GiftCraftRequestForm: React.FC<GiftCraftRequestFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [referenceImageUrl, setReferenceImageUrl] = useState("");
  const [budget, setBudget] = useState("");
  const [contact, setContact] = useState("");
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false);
  const [ambassadorMessage, setAmbassadorMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !budget || !contact) {
      toast.error("Please fill in all required fields.");
      return;
    }
    onSubmit({ title, description, referenceImageUrl, budget, contact, ambassadorDelivery, ambassadorMessage });
    setTitle("");
    setDescription("");
    setReferenceImageUrl("");
    setBudget("");
    setContact("");
    setAmbassadorDelivery(false);
    setAmbassadorMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title" className="text-foreground">Request Title</Label>
        <Input
          id="title"
          type="text"
          placeholder="e.g., Custom Painted Mug"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
      </div>
      <div>
        <Label htmlFor="description" className="text-foreground">Description of Request</Label>
        <Textarea
          id="description"
          placeholder="Describe what you want, colors, themes, etc."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
      </div>
      <div>
        <Label htmlFor="referenceImageUrl" className="text-foreground">Reference Image URL (Optional)</Label>
        <Input
          id="referenceImageUrl"
          type="text"
          placeholder="e.g., https://example.com/reference.jpg"
          value={referenceImageUrl}
          onChange={(e) => setReferenceImageUrl(e.target.value)}
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
        <p className="text-xs text-muted-foreground mt-1">Provide a link to an image for inspiration.</p>
      </div>
      <div>
        <Label htmlFor="budget" className="text-foreground">Your Budget (₹)</Label>
        <Input
          id="budget"
          type="text"
          placeholder="e.g., ₹300-₹500, Negotiable"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          required
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
      </div>
      <div>
        <Label htmlFor="contact" className="text-foreground">Contact Email</Label>
        <Input
          id="contact"
          type="email"
          placeholder="your.email@example.com"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          required
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
      </div>

      <AmbassadorDeliveryOption
        ambassadorDelivery={ambassadorDelivery}
        setAmbassadorDelivery={setAmbassadorDelivery}
        ambassadorMessage={ambassadorMessage}
        setAmbassadorMessage={setAmbassadorMessage}
      />

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" className="w-full sm:w-auto bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          Post Request
        </Button>
      </div>
    </form>
  );
};

export default GiftCraftRequestForm;