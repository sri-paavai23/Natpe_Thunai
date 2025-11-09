"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import AmbassadorDeliveryOption from "@/components/AmbassadorDeliveryOption"; // Import new component

interface SportsGearListingFormProps {
  onSubmit: (product: {
    title: string;
    price: string;
    description: string;
    condition: string; // New field
    imageUrl: string;
    ambassadorDelivery: boolean; // New field
    ambassadorMessage: string; // New field
  }) => void;
  onCancel: () => void;
}

const SportsGearListingForm: React.FC<SportsGearListingFormProps> = ({ onSubmit, onCancel }) => {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [condition, setCondition] = useState(""); // State for condition
  const [imageUrl, setImageUrl] = useState("/app-logo.png"); // Default to app logo
  const [ambassadorDelivery, setAmbassadorDelivery] = useState(false); // New state
  const [ambassadorMessage, setAmbassadorMessage] = useState(""); // New state

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !description || !condition) {
      toast.error("Please fill in all required fields.");
      return;
    }
    onSubmit({ title, price, description, condition, imageUrl, ambassadorDelivery, ambassadorMessage });
    setTitle("");
    setPrice("");
    setDescription("");
    setCondition("");
    setImageUrl("/app-logo.png");
    setAmbassadorDelivery(false);
    setAmbassadorMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title" className="text-foreground">Title</Label>
        <Input
          id="title"
          type="text"
          placeholder="e.g., Cricket Bat"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
      </div>
      <div>
        <Label htmlFor="price" className="text-foreground">Price</Label>
        <Input
          id="price"
          type="text"
          placeholder="e.g., ₹1500"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
      </div>
      <div>
        <Label htmlFor="description" className="text-foreground">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your sports gear..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
      </div>
      <div>
        <Label htmlFor="condition" className="text-foreground">Condition</Label>
        <Select value={condition} onValueChange={setCondition} required>
          <SelectTrigger className="w-full bg-input text-foreground border-border focus:ring-ring focus:border-ring">
            <SelectValue placeholder="Select condition" />
          </SelectTrigger>
          <SelectContent className="bg-popover text-popover-foreground border-border">
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="used-like-new">Used - Like New</SelectItem>
            <SelectItem value="used-good">Used - Good</SelectItem>
            <SelectItem value="used-fair">Used - Fair</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="imageUrl" className="text-foreground">Image URL (Optional)</Label>
        <Input
          id="imageUrl"
          type="text"
          placeholder="e.g., https://example.com/image.jpg"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="bg-input text-foreground border-border focus:ring-ring focus:border-ring"
        />
        <p className="text-xs text-muted-foreground mt-1">Defaults to app logo if empty.</p>
      </div>

      <AmbassadorDeliveryOption
        ambassadorDelivery={ambassadorDelivery}
        setAmbassadorDelivery={setAmbassadorDelivery}
        ambassadorMessage={ambassadorMessage}
        setAmbassadorMessage={setAmbassadorMessage}
      />

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-border text-primary-foreground hover:bg-muted">
          Cancel
        </Button>
        <Button type="submit" className="bg-secondary-neon text-primary-foreground hover:bg-secondary-neon/90">
          Create Listing
        </Button>
      </div>
    </form>
  );
};

export default SportsGearListingForm;